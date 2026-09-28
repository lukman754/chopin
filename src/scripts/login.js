// Login page logic: GitHub OAuth via Supabase, redirects to /admin once authenticated.
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const $ = (selector) => document.querySelector(selector);
const githubBtn = $("#github-login-btn");
const loginError = $("#login-error");

function showError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
}

async function init() {
  if (!isSupabaseConfigured) {
    showError(
      "Supabase belum dikonfigurasi. Isi PUBLIC_SUPABASE_ANON_KEY di file .env lalu restart dev server.",
    );
    githubBtn.disabled = true;
    return;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) window.location.replace("/admin");
}

githubBtn.addEventListener("click", async () => {
  loginError.hidden = true;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${window.location.origin}/admin` },
  });
  if (error) showError(error.message);
});

init();
