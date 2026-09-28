// GitHub data fetching + README image parsing, kept separate from UI rendering.

const GITHUB_OWNER = "lukman754";

export interface FeaturedProject {
  name: string;
  owner: string;
  description: string;
  language: string;
  topics: string[];
  stars: number;
  forks: number;
  url: string;
  homepage: string | null;
  images: string[];
}

interface GithubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  homepage: string | null;
  default_branch: string;
}

// Module-level caches so repeated calls (e.g. dev server reloads) don't refetch.
const repoListCache = new Map<string, Promise<GithubRepo[]>>();
const readmeImagesCache = new Map<string, Promise<string[]>>();
const MAX_IMAGES_PER_REPO = 8;

// atob is available in both browser and Node/Astro SSR runtimes.
function decodeBase64(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function fetchRepoList(owner: string): Promise<GithubRepo[]> {
  if (!repoListCache.has(owner)) {
    const promise = fetch(
      `https://api.github.com/users/${owner}/repos?per_page=100`,
    )
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(
              new Error(
                `GitHub repos request failed for ${owner}: ${res.status}`,
              ),
            ),
      )
      .catch((err) => {
        repoListCache.delete(owner); // allow retry on next call
        throw err;
      });
    repoListCache.set(owner, promise);
  }
  return repoListCache.get(owner)!;
}

/** Resolve a possibly-relative README image path into an absolute raw GitHub URL. */
function resolveImageUrl(
  rawPath: string,
  owner: string,
  repo: string,
  branch: string,
): string {
  const path = rawPath.trim();

  if (path.startsWith("http://") || path.startsWith("https://")) {
    // github.com/.../blob/<branch>/<path> -> raw.githubusercontent.com/.../<branch>/<path>
    const blobMatch = path.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/,
    );
    if (blobMatch) {
      const [, blobOwner, blobRepo, restPath] = blobMatch;
      return `https://raw.githubusercontent.com/${blobOwner}/${blobRepo}/${restPath}`;
    }
    return path;
  }

  const cleanedPath = path.replace(/^\.\//, "").replace(/^\//, "");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanedPath}`;
}

/** Find every Markdown/HTML image reference in a README, in document order, and resolve each URL. */
function parseAllImages(
  markdown: string,
  owner: string,
  repo: string,
  branch: string,
): string[] {
  const imageTag =
    /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = imageTag.exec(markdown)) !== null) {
    const rawUrl = match[1] ?? match[2];
    if (!rawUrl) continue;
    const resolved = resolveImageUrl(rawUrl, owner, repo, branch);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      urls.push(resolved);
    }
    if (urls.length >= MAX_IMAGES_PER_REPO) break;
  }

  return urls;
}

async function fetchReadmeImages(
  owner: string,
  repo: string,
  branch: string,
): Promise<string[]> {
  const cacheKey = `${owner}/${repo}`;
  if (!readmeImagesCache.has(cacheKey)) {
    const promise = (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/readme`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        const content = decodeBase64(data.content);
        return parseAllImages(content, owner, repo, branch);
      } catch (err) {
        console.error(
          `Failed to parse README images for ${owner}/${repo}`,
          err,
        );
        return [];
      }
    })();
    readmeImagesCache.set(cacheKey, promise);
  }
  return readmeImagesCache.get(cacheKey)!;
}

/**
 * Fetch and shape the featured repositories for the projects section.
 * `featuredRepos` controls which repos appear and in what order. Entries can be
 * a plain repo name (uses the default `owner`) or "someone-else/repo-name" to
 * pull in a repo you contributed to under a different GitHub account.
 */
export async function fetchFeaturedRepos(
  featuredRepos: string[],
  owner: string = GITHUB_OWNER,
): Promise<FeaturedProject[]> {
  const entries = featuredRepos
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const slashIndex = entry.indexOf("/");
      return slashIndex > -1
        ? {
            owner: entry.slice(0, slashIndex).trim(),
            name: entry.slice(slashIndex + 1).trim(),
          }
        : { owner, name: entry };
    });

  const ownersNeeded = [...new Set(entries.map((entry) => entry.owner))];
  const repoListsByOwner = new Map(
    await Promise.all(
      ownersNeeded.map(
        async (ownerName) =>
          [ownerName, await fetchRepoList(ownerName)] as const,
      ),
    ),
  );

  const selected = entries
    .map(({ owner: entryOwner, name }) => {
      const repo = repoListsByOwner
        .get(entryOwner)
        ?.find(
          (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
        );
      return repo ? { owner: entryOwner, repo } : null;
    })
    .filter((entry): entry is { owner: string; repo: GithubRepo } =>
      Boolean(entry),
    );

  return Promise.all(
    selected.map(async ({ owner: repoOwner, repo }) => {
      const images = await fetchReadmeImages(
        repoOwner,
        repo.name,
        repo.default_branch,
      );
      return {
        name: repo.name,
        owner: repoOwner,
        description: repo.description ?? "Tidak ada deskripsi.",
        language: repo.language ?? "REPOSITORY",
        topics: repo.topics ?? [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        homepage: repo.homepage || null,
        images,
      };
    }),
  );
}
