// Admin dashboard logic: Supabase auth + CRUD for every editable portfolio section.
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { fetchFeaturedRepos } from "../lib/github";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeAttr = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const dashboardSection = $("#admin-dashboard");
const statusEl = $("#admin-status");

let statusTimer;
function showStatus(message, type = "success") {
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.className = `admin-status is-${type}`;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.hidden = true;
  }, 4000);
}

function createRow(fieldsHtml) {
  const row = document.createElement("div");
  row.className = "admin-row";
  row.innerHTML = `<div class="admin-row-fields">${fieldsHtml}</div><button type="button" class="admin-row-remove">✕</button>`;
  row.querySelector(".admin-row-remove").addEventListener("click", () => {
    const container = row.parentElement;
    row.remove();
    container?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return row;
}

/** Replace all rows in a table with the current in-memory list (simplest reliable sync for a small admin tool). */
async function saveList(table, rows) {
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .gte("sort_order", -1);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error: insertError } = await supabase.from(table).insert(rows);
    if (insertError) throw insertError;
  }
}

// ---------- Row templates ----------
function aboutSkillRow(skill = { label: "", core: false }) {
  return createRow(`
    <label>Label<input data-key="label" value="${escapeAttr(skill.label)}" /></label>
    <label><input type="checkbox" data-key="core" ${skill.core ? "checked" : ""} /> Core skill</label>
  `);
}
function aboutMetaRow(row = { label: "", value: "" }) {
  return createRow(`
    <label>Label<input data-key="label" value="${escapeAttr(row.label)}" /></label>
    <label>Value<input data-key="value" value="${escapeAttr(row.value)}" /></label>
  `);
}
function skillGroupRow(group = { label: "", items: [] }) {
  return createRow(`
    <label>Label group<input data-key="label" value="${escapeAttr(group.label)}" /></label>
    <label>Items (pisahkan koma)<input data-key="items" value="${escapeAttr((group.items || []).join(", "))}" /></label>
  `);
}
function progressRow(item = { label: "", value: 0 }) {
  return createRow(`
    <label>Label<input data-key="label" value="${escapeAttr(item.label)}" /></label>
    <label>Value (0-100)<input data-key="value" type="number" min="0" max="100" value="${item.value ?? 0}" /></label>
  `);
}
function certificateRow(cert = {}) {
  return createRow(`
    <label>Gambar (URL)<input data-key="image_url" value="${escapeAttr(cert.image_url)}" /></label>
    <label>Upload gambar<input type="file" accept="image/*" data-upload-row="image_url" /></label>
    <label>Tipe<input data-key="type" value="${escapeAttr(cert.type)}" /></label>
    <label>Judul<input data-key="title" value="${escapeAttr(cert.title)}" /></label>
    <label>Issuer<input data-key="issuer" value="${escapeAttr(cert.issuer)}" /></label>
    <label>Tanggal<input data-key="date_label" value="${escapeAttr(cert.date_label)}" /></label>
  `);
}
function experienceRow(item = {}) {
  return createRow(`
    <label>Tanggal<input data-key="date_label" value="${escapeAttr(item.date_label)}" /></label>
    <label>Index<input data-key="index_label" value="${escapeAttr(item.index_label)}" /></label>
    <label>Judul<input data-key="title" value="${escapeAttr(item.title)}" /></label>
    <label>Tempat<input data-key="place" value="${escapeAttr(item.place)}" /></label>
    <label>Deskripsi<textarea data-key="description" rows="2">${escapeAttr(item.description)}</textarea></label>
  `);
}

const rowFactories = {
  about_skills: aboutSkillRow,
  about_meta: aboutMetaRow,
  skill_groups: skillGroupRow,
  progress_items: progressRow,
  certificates: certificateRow,
  experience_items: experienceRow,
};

$$("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.add;
    const container = $(`[data-list="${key}"]`);
    const factory = rowFactories[key];
    if (factory && container) {
      container.appendChild(factory());
      container.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
});

// ---------- Collectors ----------
function collectRows(container, keys) {
  return $$(".admin-row", container).map((row) => {
    const obj = {};
    keys.forEach((key) => {
      const el = row.querySelector(`[data-key="${key}"]`);
      if (!el) return;
      obj[key] = el.type === "checkbox" ? el.checked : el.value;
    });
    return obj;
  });
}
function collectSkillGroups() {
  return $$(".admin-row", $('[data-list="skill_groups"]')).map(
    (row, index) => ({
      label: row.querySelector('[data-key="label"]').value,
      items: row
        .querySelector('[data-key="items"]')
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sort_order: index,
    }),
  );
}
function collectSimpleList(listKey, keys) {
  return $$(".admin-row", $(`[data-list="${listKey}"]`)).map((row, index) => {
    const obj = { sort_order: index };
    keys.forEach((key) => {
      const el = row.querySelector(`[data-key="${key}"]`);
      obj[key] = key === "value" ? Number(el.value) || 0 : el.value;
    });
    return obj;
  });
}

// ---------- Live preview ----------
function renderProfilePreview() {
  const form = $("#profile-form");
  const photo = $("#preview-photo");
  photo.src = form.intro_photo_casual.value || "/assets/1.webp";
  $("#preview-name").textContent = form.intro_name.value || "—";
  $("#preview-meta-line").textContent = [
    form.intro_role.value,
    form.intro_faction.value,
    form.intro_race.value,
  ]
    .filter(Boolean)
    .join(" · ");
  $("#preview-bio").innerHTML = form.about_bio.value || "";

  const skills = collectRows($('[data-list="about_skills"]', form), [
    "label",
    "core",
  ]);
  $("#preview-skills").innerHTML = skills
    .map(
      (s) =>
        `<span class="glass-skill-chip${s.core ? " glass-skill-chip--core" : ""}">${
          s.core
            ? `<strong>${escapeAttr(s.label)}</strong>`
            : `<span>${escapeAttr(s.label)}</span>`
        }</span>`,
    )
    .join("");

  const metaRows = collectRows($('[data-list="about_meta"]', form), [
    "label",
    "value",
  ]);
  $("#preview-meta").innerHTML = metaRows
    .map(
      (m) =>
        `<div class="meta-row"><span>${escapeAttr(m.label)}</span><span>${escapeAttr(m.value)}</span></div>`,
    )
    .join("");

  $("#preview-contact").innerHTML = `
    <div class="contact-row"><span>EMAIL</span><span>${escapeAttr(form.contact_email.value)}</span></div>
    <div class="contact-row"><span>GITHUB</span><span>${escapeAttr(form.contact_github.value)}</span></div>
    <div class="contact-row"><span>LINKEDIN</span><span>${escapeAttr(form.contact_linkedin.value)}</span></div>
  `;
}

function renderSkillsPreview() {
  const groups = collectSkillGroups();
  $("#preview-skill-groups").innerHTML = groups
    .map(
      (g) => `
    <div class="skill-group">
      <div class="skill-group-head"><span>${escapeAttr(g.label)}</span><span>01</span></div>
      <div class="skill-list">${g.items.map((item) => `<span class="skill-pill">${escapeAttr(item)}</span>`).join("")}</div>
    </div>`,
    )
    .join("");

  const progressItems = collectSimpleList("progress_items", ["label", "value"]);
  $("#preview-progress").innerHTML = progressItems
    .map(
      (p) => `
    <div>
      <div class="progress-label"><span>${escapeAttr(p.label)}</span><span>${p.value}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${p.value}%"></div></div>
    </div>`,
    )
    .join("");
}

function renderCertificatesPreview() {
  const certs = collectSimpleList("certificates", [
    "image_url",
    "type",
    "title",
    "issuer",
    "date_label",
  ]);
  $("#preview-certificates").innerHTML = certs.length
    ? certs
        .map(
          (c) => `
    <div class="preview-cert-card">
      ${c.image_url ? `<img src="${escapeAttr(c.image_url)}" alt="${escapeAttr(c.title)}" />` : ""}
      <div class="admin-hint">${escapeAttr(c.type)} · ${escapeAttr(c.date_label)}</div>
      <strong>${escapeAttr(c.title)}</strong>
      <div class="admin-hint">${escapeAttr(c.issuer)}</div>
    </div>`,
        )
        .join("")
    : '<p class="admin-hint">Belum ada sertifikat.</p>';
}

function renderExperiencePreview() {
  const items = collectSimpleList("experience_items", [
    "date_label",
    "index_label",
    "title",
    "place",
    "description",
  ]);
  $("#preview-experience").innerHTML = items.length
    ? items
        .map(
          (item) => `
    <div class="preview-experience-card">
      <div class="admin-hint">${escapeAttr(item.index_label)} · ${escapeAttr(item.date_label)}</div>
      <strong>${escapeAttr(item.title)}</strong>
      <div class="admin-hint">${escapeAttr(item.place)}</div>
      <p style="font-size:11px;margin-top:6px;">${escapeAttr(item.description)}</p>
    </div>`,
        )
        .join("")
    : '<p class="admin-hint">Belum ada experience.</p>';
}

$('[data-panel="profile"] .admin-editor').addEventListener(
  "input",
  renderProfilePreview,
);
$('[data-panel="skills"] .admin-editor').addEventListener(
  "input",
  renderSkillsPreview,
);
$('[data-panel="certificates"] .admin-editor').addEventListener(
  "input",
  renderCertificatesPreview,
);
$('[data-panel="experience"] .admin-editor').addEventListener(
  "input",
  renderExperiencePreview,
);

// ---------- Image upload ----------
async function uploadFile(file) {
  const path = `uploads/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("portfolio")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}
document.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "file") return;
  const file = target.files?.[0];
  if (!file) return;
  try {
    const url = await uploadFile(file);
    if (target.dataset.uploadTarget) {
      const input = $(`#profile-form [name="${target.dataset.uploadTarget}"]`);
      if (input) {
        input.value = url;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else if (target.dataset.uploadRow) {
      const row = target.closest(".admin-row");
      const input = row?.querySelector(
        `[data-key="${target.dataset.uploadRow}"]`,
      );
      if (input) {
        input.value = url;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else if (target.hasAttribute("data-upload-project-image")) {
      const imagesContainer = target
        .closest(".admin-row")
        ?.querySelector("[data-project-images]");
      imagesContainer?.insertAdjacentHTML(
        "beforeend",
        `<div class="preview-project-image-item"><img src="${escapeAttr(url)}" alt="" /><button type="button" class="admin-row-remove" data-remove-image>✕</button></div>`,
      );
      target.value = "";
    }
    showStatus("Gambar berhasil diupload.");
  } catch (err) {
    showStatus(`Upload gagal: ${err.message}`, "error");
  }
});

// ---------- Load sections ----------
async function loadProfile() {
  const { data } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .single();
  const profile = data || {};
  const form = $("#profile-form");
  [
    "intro_name",
    "intro_role",
    "intro_faction",
    "intro_race",
    "intro_photo_casual",
    "intro_photo_formal",
    "about_bio",
    "contact_email",
    "contact_github",
    "contact_linkedin",
  ].forEach((key) => {
    const input = form.elements.namedItem(key);
    if (input) input.value = profile[key] ?? "";
  });
  const skillsList = $('[data-list="about_skills"]', form);
  skillsList.innerHTML = "";
  (profile.about_skills ?? []).forEach((skill) =>
    skillsList.appendChild(aboutSkillRow(skill)),
  );
  const metaList = $('[data-list="about_meta"]', form);
  metaList.innerHTML = "";
  (profile.about_meta ?? []).forEach((row) =>
    metaList.appendChild(aboutMetaRow(row)),
  );
}

async function loadSkillGroups() {
  const { data } = await supabase
    .from("skill_groups")
    .select("*")
    .order("sort_order");
  const container = $('[data-list="skill_groups"]');
  container.innerHTML = "";
  (data ?? []).forEach((group) => container.appendChild(skillGroupRow(group)));
}

async function loadProgressItems() {
  const { data } = await supabase
    .from("progress_items")
    .select("*")
    .order("sort_order");
  const container = $('[data-list="progress_items"]');
  container.innerHTML = "";
  (data ?? []).forEach((item) => container.appendChild(progressRow(item)));
}

async function loadCertificates() {
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .order("sort_order");
  const container = $('[data-list="certificates"]');
  container.innerHTML = "";
  (data ?? []).forEach((cert) => container.appendChild(certificateRow(cert)));
}

async function loadExperienceItems() {
  const { data } = await supabase
    .from("experience_items")
    .select("*")
    .order("sort_order");
  const container = $('[data-list="experience_items"]');
  container.innerHTML = "";
  (data ?? []).forEach((item) => container.appendChild(experienceRow(item)));
}

function renderProjectsPreview(rows) {
  const container = $('[data-list="projects_preview"]');
  container.innerHTML = rows.length
    ? rows
        .map(
          (r) => `
    <div class="admin-row" data-project-id="${r.id}">
      <div class="admin-row-fields">
        <strong>${escapeAttr(r.repo_name)}</strong> <span class="admin-hint">(${escapeAttr(r.owner)})</span>
        <div class="admin-hint">${escapeAttr(r.description)}</div>
        <div class="admin-hint">★ ${r.stars} · ⑂ ${r.forks}</div>
        <div class="preview-project-images" data-project-images>
          ${(r.images ?? [])
            .map(
              (img) => `
            <div class="preview-project-image-item">
              <img src="${escapeAttr(img)}" alt="" />
              <button type="button" class="admin-row-remove" data-remove-image>✕</button>
            </div>`,
            )
            .join("")}
        </div>
        <label>Tambah gambar<input type="file" accept="image/*" data-upload-project-image /></label>
      </div>
      <button type="button" class="admin-row-remove" data-remove-project title="Hapus project ini">✕ HAPUS</button>
    </div>`,
        )
        .join("")
    : '<p class="admin-hint">Belum ada project tersimpan.</p>';
}

async function removeProjectById(id) {
  if (!window.confirm("Hapus project ini dari daftar?")) return;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    showStatus(`Gagal hapus project: ${error.message}`, "error");
    return;
  }
  $(`.admin-row[data-project-id="${id}"]`)?.remove();
  showStatus("Project dihapus.");
}

document.addEventListener("click", (event) => {
  const removeImageBtn = event.target.closest("[data-remove-image]");
  if (removeImageBtn) {
    removeImageBtn.closest(".preview-project-image-item")?.remove();
    return;
  }
  const removeProjectBtn = event.target.closest("[data-remove-project]");
  if (removeProjectBtn) {
    const id = removeProjectBtn.closest(".admin-row[data-project-id]")?.dataset
      .projectId;
    if (id) removeProjectById(id);
  }
});

$("#save-project-images").addEventListener("click", async () => {
  const rows = $$(".admin-row[data-project-id]");
  try {
    await Promise.all(
      rows.map(async (row) => {
        const id = row.dataset.projectId;
        const images = $$("[data-project-images] img", row).map((img) =>
          img.getAttribute("src"),
        );
        const { error } = await supabase
          .from("projects")
          .update({ images })
          .eq("id", id);
        if (error) throw error;
      }),
    );
    showStatus("Perubahan gambar project tersimpan.");
  } catch (err) {
    showStatus(`Gagal simpan gambar: ${err.message}`, "error");
  }
});

async function loadProjects() {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  const rows = data ?? [];
  $("#featured-repo-names").value = rows
    .map((r) =>
      r.owner === "lukman754" ? r.repo_name : `${r.owner}/${r.repo_name}`,
    )
    .join(", ");
  renderProjectsPreview(rows);
}

async function loadAll() {
  await Promise.all([
    loadProfile(),
    loadSkillGroups(),
    loadProgressItems(),
    loadCertificates(),
    loadExperienceItems(),
    loadProjects(),
  ]);
  renderProfilePreview();
  renderSkillsPreview();
  renderCertificatesPreview();
  renderExperiencePreview();
}

// ---------- Save handlers ----------
$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const payload = {
    id: 1,
    intro_name: form.intro_name.value,
    intro_role: form.intro_role.value,
    intro_faction: form.intro_faction.value,
    intro_race: form.intro_race.value,
    intro_photo_casual: form.intro_photo_casual.value,
    intro_photo_formal: form.intro_photo_formal.value,
    about_bio: form.about_bio.value,
    about_skills: collectRows($('[data-list="about_skills"]', form), [
      "label",
      "core",
    ]),
    about_meta: collectRows($('[data-list="about_meta"]', form), [
      "label",
      "value",
    ]),
    contact_email: form.contact_email.value,
    contact_github: form.contact_github.value,
    contact_linkedin: form.contact_linkedin.value,
  };
  const { error } = await supabase.from("profile").upsert(payload);
  if (error) showStatus(`Gagal simpan profile: ${error.message}`, "error");
  else showStatus("Profile tersimpan.");
});

$("#save-skill-groups").addEventListener("click", async () => {
  try {
    await saveList("skill_groups", collectSkillGroups());
    showStatus("Skill groups tersimpan.");
  } catch (err) {
    showStatus(`Gagal simpan: ${err.message}`, "error");
  }
});

$("#save-progress-items").addEventListener("click", async () => {
  try {
    await saveList(
      "progress_items",
      collectSimpleList("progress_items", ["label", "value"]),
    );
    showStatus("Progress bars tersimpan.");
  } catch (err) {
    showStatus(`Gagal simpan: ${err.message}`, "error");
  }
});

$("#save-certificates").addEventListener("click", async () => {
  try {
    await saveList(
      "certificates",
      collectSimpleList("certificates", [
        "image_url",
        "type",
        "title",
        "issuer",
        "date_label",
      ]),
    );
    showStatus("Certificates tersimpan.");
  } catch (err) {
    showStatus(`Gagal simpan: ${err.message}`, "error");
  }
});

$("#save-experience-items").addEventListener("click", async () => {
  try {
    await saveList(
      "experience_items",
      collectSimpleList("experience_items", [
        "date_label",
        "index_label",
        "title",
        "place",
        "description",
      ]),
    );
    showStatus("Experience tersimpan.");
  } catch (err) {
    showStatus(`Gagal simpan: ${err.message}`, "error");
  }
});

$("#sync-github-btn").addEventListener("click", async () => {
  const names = $("#featured-repo-names")
    .value.split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const syncStatus = $("#sync-status");
  if (!names.length) {
    syncStatus.textContent = "Isi minimal 1 nama repo.";
    return;
  }
  syncStatus.textContent = "Sinkronisasi dari GitHub...";
  try {
    const results = await fetchFeaturedRepos(names);
    const rows = results.map((project, index) => ({
      repo_name: project.name,
      owner: project.owner,
      description: project.description,
      language: project.language,
      topics: project.topics,
      stars: project.stars,
      forks: project.forks,
      url: project.url,
      homepage: project.homepage,
      images: project.images,
      is_featured: true,
      sort_order: index,
    }));
    await saveList("projects", rows);
    syncStatus.textContent = `Berhasil sync ${rows.length} project.`;
    renderProjectsPreview(rows);
    showStatus("Project berhasil disinkronkan dari GitHub.");
  } catch (err) {
    syncStatus.textContent = `Gagal sync: ${err.message}`;
    showStatus(`Gagal sync: ${err.message}`, "error");
  }
});

// ---------- Tabs ----------
$$(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".admin-tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    $$(".admin-panel-body").forEach((panel) => {
      panel.classList.toggle(
        "is-active",
        panel.dataset.panel === tab.dataset.tab,
      );
    });
  });
});

// ---------- Auth ----------
function showDashboard() {
  dashboardSection.hidden = false;
  loadAll();
}

async function init() {
  if (!isSupabaseConfigured) {
    showStatus(
      "Supabase belum dikonfigurasi. Isi PUBLIC_SUPABASE_ANON_KEY di file .env lalu restart dev server.",
      "error",
    );
    return;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) showDashboard();
  else window.location.replace("/login");

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) window.location.replace("/login");
  });
}

$("#logout-btn").addEventListener("click", () => supabase.auth.signOut());

init();
