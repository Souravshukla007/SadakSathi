"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

// The theme lives on <html data-theme>, set before paint by the inline script in layout.tsx.
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export default function ThemeToggle({ className = "" }: { className?: string }) {
    // null during server render, so the first client render matches the HTML.
    const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);
    const next: Theme = theme === "dark" ? "light" : "dark";

    const toggle = () => {
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch { /* private mode: still switches for this visit */ }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme ? `Switch to ${next} mode` : "Switch colour theme"}
            title={theme ? `Switch to ${next} mode` : undefined}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-neutral-surface hover:text-text-primary ${className}`}
        >
            {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>
    );
}
