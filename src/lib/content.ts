// Fetches editable portfolio content from Supabase, with hardcoded fallbacks so the
// site still builds correctly before PUBLIC_SUPABASE_ANON_KEY / the DB schema are set up.
import { supabase, isSupabaseConfigured } from "./supabase";

export interface Profile {
  intro_name: string;
  intro_role: string;
  intro_faction: string;
  intro_race: string;
  intro_photo_casual: string;
  intro_photo_formal: string;
  about_bio: string;
  about_skills: { label: string; core: boolean }[];
  about_meta: { label: string; value: string }[];
  contact_email: string;
  contact_github: string;
  contact_linkedin: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
  sort_order: number;
}

export interface ProgressItem {
  id: string;
  label: string;
  value: number;
  sort_order: number;
}

export interface Certificate {
  id: string;
  image_url: string;
  type: string;
  title: string;
  issuer: string;
  date_label: string;
  sort_order: number;
}

export interface ExperienceItem {
  id: string;
  date_label: string;
  index_label: string;
  title: string;
  place: string;
  description: string;
  sort_order: number;
}

export interface ProjectRecord {
  id: string;
  repo_name: string;
  owner: string;
  description: string;
  language: string;
  topics: string[];
  stars: number;
  forks: number;
  url: string;
  homepage: string | null;
  images: string[];
  is_featured: boolean;
  sort_order: number;
}

const DEFAULT_PROFILE: Profile = {
  intro_name: "LUKMAN MULUDIN.",
  intro_role: "WEB DEVELOPER",
  intro_faction: "CHOPIN SYSTEMS",
  intro_race: "HUMAN",
  intro_photo_casual: "/assets/1.webp",
  intro_photo_formal: "/assets/4.webp",
  about_bio:
    "Saya Lukman Muludin (Chopin), seorang lulusan Sistem Informasi dan Web Developer yang aktif menerapkan AI-assisted development dalam alur kerja pembuatan perangkat lunak.",
  about_skills: [
    { label: "Web Development", core: true },
    { label: "Database", core: false },
    { label: "Automation", core: false },
    { label: "Data Processing", core: false },
    { label: "UI/UX", core: false },
    { label: "Graphic Designer", core: false },
  ],
  about_meta: [
    { label: "CORE IDENTITY", value: "WEB DEVELOPER" },
    { label: "BACKGROUND", value: "INFORMATION SYSTEMS GRADUATE" },
    { label: "WORKFLOW", value: "AI-ASSISTED DEVELOPMENT" },
    { label: "METHODOLOGY", value: "SYSTEM THINKING & DB LOGIC" },
    { label: "APPROACH", value: "LEARNING BY BUILDING" },
  ],
  contact_email: "lukmanmauludin831@gmail.com",
  contact_github: "github.com/lukman754",
  contact_linkedin: "linkedin.com/in/lukman-muludin",
};

const DEFAULT_SKILL_GROUPS: SkillGroup[] = [
  {
    id: "languages",
    label: "LANGUAGES",
    items: ["PHP", "JavaScript", "Python", "SQL", "HTML", "CSS"],
    sort_order: 0,
  },
  {
    id: "framework",
    label: "FRAMEWORK / TOOLS",
    items: ["Bootstrap", "Tailwind", "CodeIgniter", "Git", "Composer"],
    sort_order: 1,
  },
  {
    id: "database",
    label: "DATABASE",
    items: ["MySQL", "MariaDB", "phpMyAdmin"],
    sort_order: 2,
  },
];

const DEFAULT_PROGRESS_ITEMS: ProgressItem[] = [
  { id: "web", label: "WEB DEVELOPMENT", value: 90, sort_order: 0 },
  { id: "db", label: "DATABASE / SQL", value: 85, sort_order: 1 },
  { id: "automation", label: "AUTOMATION", value: 82, sort_order: 2 },
  { id: "ui", label: "UI IMPLEMENTATION", value: 86, sort_order: 3 },
  { id: "data", label: "DATA / PYTHON", value: 72, sort_order: 4 },
];

const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: "1",
    image_url: "/assets/certificates/sertif1.jpg",
    type: "CERTIFICATE / WEB SYSTEM",
    title: "FULL STACK WEB DEVELOPMENT",
    issuer: "DIGITAL LEARNING ARCHIVE",
    date_label: "2026 / 01",
    sort_order: 0,
  },
  {
    id: "2",
    image_url: "/assets/certificates/sertif2.jpg",
    type: "ACHIEVEMENT / AUTOMATION",
    title: "BROWSER AUTOMATION SYSTEM",
    issuer: "FIELD OPERATIONS UNIT",
    date_label: "2025 / 11",
    sort_order: 1,
  },
  {
    id: "3",
    image_url: "/assets/certificates/sertif3.jpg",
    type: "CERTIFICATE / DATA",
    title: "DATABASE & INFORMATION SYSTEMS",
    issuer: "ACADEMIC SYSTEMS LAB",
    date_label: "2025 / 08",
    sort_order: 2,
  },
  {
    id: "4",
    image_url: "/assets/certificates/sertif4.jpg",
    type: "ACHIEVEMENT / DESIGN POSTER",
    title: "NATIONAL POSTER COMPETITION",
    issuer: "UNIVERSITAS NEGERI YOGYAKARTA",
    date_label: "2023 / 04",
    sort_order: 3,
  },
];

const DEFAULT_EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    id: "1",
    date_label: "2026 / PRESENT",
    index_label: "01",
    title: "Software / Web Development",
    place: "PERSONAL PROJECTS / FREELANCE / ACADEMIC",
    description:
      "Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.",
    sort_order: 0,
  },
  {
    id: "2",
    date_label: "INTERNSHIP",
    index_label: "02",
    title: "IT / Student Support",
    place: "FAKULTAS ILMU KOMPUTER",
    description:
      "Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.",
    sort_order: 1,
  },
  {
    id: "3",
    date_label: "ACADEMIC",
    index_label: "03",
    title: "Information Systems",
    place: "UNIVERSITAS PAMULANG",
    description:
      "Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.",
    sort_order: 2,
  },
];

export async function getProfile(): Promise<Profile> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_PROFILE;
  try {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return DEFAULT_PROFILE;
    return {
      intro_name: data.intro_name ?? DEFAULT_PROFILE.intro_name,
      intro_role: data.intro_role ?? DEFAULT_PROFILE.intro_role,
      intro_faction: data.intro_faction ?? DEFAULT_PROFILE.intro_faction,
      intro_race: data.intro_race ?? DEFAULT_PROFILE.intro_race,
      intro_photo_casual:
        data.intro_photo_casual ?? DEFAULT_PROFILE.intro_photo_casual,
      intro_photo_formal:
        data.intro_photo_formal ?? DEFAULT_PROFILE.intro_photo_formal,
      about_bio: data.about_bio ?? DEFAULT_PROFILE.about_bio,
      about_skills: data.about_skills?.length
        ? data.about_skills
        : DEFAULT_PROFILE.about_skills,
      about_meta: data.about_meta?.length
        ? data.about_meta
        : DEFAULT_PROFILE.about_meta,
      contact_email: data.contact_email ?? DEFAULT_PROFILE.contact_email,
      contact_github: data.contact_github ?? DEFAULT_PROFILE.contact_github,
      contact_linkedin:
        data.contact_linkedin ?? DEFAULT_PROFILE.contact_linkedin,
    };
  } catch (err) {
    console.error("Failed to fetch profile from Supabase", err);
    return DEFAULT_PROFILE;
  }
}

export async function getSkillGroups(): Promise<SkillGroup[]> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_SKILL_GROUPS;
  try {
    const { data, error } = await supabase
      .from("skill_groups")
      .select("*")
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_SKILL_GROUPS;
    return data;
  } catch (err) {
    console.error("Failed to fetch skill groups from Supabase", err);
    return DEFAULT_SKILL_GROUPS;
  }
}

export async function getProgressItems(): Promise<ProgressItem[]> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_PROGRESS_ITEMS;
  try {
    const { data, error } = await supabase
      .from("progress_items")
      .select("*")
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_PROGRESS_ITEMS;
    return data;
  } catch (err) {
    console.error("Failed to fetch progress items from Supabase", err);
    return DEFAULT_PROGRESS_ITEMS;
  }
}

export async function getCertificates(): Promise<Certificate[]> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_CERTIFICATES;
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_CERTIFICATES;
    return data;
  } catch (err) {
    console.error("Failed to fetch certificates from Supabase", err);
    return DEFAULT_CERTIFICATES;
  }
}

export async function getExperienceItems(): Promise<ExperienceItem[]> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_EXPERIENCE_ITEMS;
  try {
    const { data, error } = await supabase
      .from("experience_items")
      .select("*")
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_EXPERIENCE_ITEMS;
    return data;
  } catch (err) {
    console.error("Failed to fetch experience items from Supabase", err);
    return DEFAULT_EXPERIENCE_ITEMS;
  }
}

/** Featured projects, cached in Supabase by the admin's "Sync from GitHub" action. */
export async function getFeaturedProjects(): Promise<ProjectRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("sort_order");
    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("Failed to fetch projects from Supabase", err);
    return [];
  }
}
