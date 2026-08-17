/**
 * Three-way theme control: dark / light / auto (prototype lines 342–381).
 * The no-flash initial resolve happens inline in Base.astro before paint;
 * this module only handles clicks and keeps the segmented control in sync.
 */

const STORAGE_KEY = "vts:theme";

type Theme = "dark" | "light" | "auto";

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "auto";
}

function stored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

/** Resolves "auto" against the OS preference and writes [data-theme]. */
function resolve(theme: Theme): void {
  const dark =
    theme === "dark"
      ? true
      : theme === "light"
        ? false
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function paintButtons(active: Theme): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-option]",
  )) {
    const selected = button.dataset.themeOption === active;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("bg-card-2", selected);
    button.classList.toggle("text-ink", selected);
    button.classList.toggle("text-ink-3", !selected);
  }
}

export function initTheme(): void {
  const current = stored();
  resolve(current);
  paintButtons(current);

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-option]",
  )) {
    button.addEventListener("click", () => {
      const next = button.dataset.themeOption;
      if (!isTheme(next ?? null)) return;
      const theme = next as Theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* storage unavailable — the theme still applies for this session */
      }
      resolve(theme);
      paintButtons(theme);
    });
  }

  // While on "auto", track OS changes live rather than waiting for a reload.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (stored() === "auto") resolve("auto");
    });
}
