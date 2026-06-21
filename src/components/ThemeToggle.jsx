import React, { useEffect, useState } from "react";

const STORAGE_KEY = "adminThemeMode";

function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(mode) {
    const resolved = mode === "auto" ? (systemPrefersDark() ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-theme", resolved);
}

const MODES = [
    { key: "auto", icon: "🌓", label: "Auto" },
    { key: "light", icon: "☀", label: "Light" },
    { key: "dark", icon: "🌙", label: "Dark" },
];

export default function ThemeToggle() {
    const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || "auto");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode);
        applyTheme(mode);
        if (mode === "auto") {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme("auto");
            mq.addEventListener("change", handler);
            return () => mq.removeEventListener("change", handler);
        }
    }, [mode]);

    return (
        <div className="theme-toggle" role="group" aria-label="Theme">
            {MODES.map((m) => (
                <button
                    key={m.key}
                    type="button"
                    className={`theme-toggle-btn ${mode === m.key ? "active" : ""}`}
                    onClick={() => setMode(m.key)}
                    title={m.label}
                    aria-pressed={mode === m.key}
                >
                    {m.icon}
                </button>
            ))}
        </div>
    );
}
