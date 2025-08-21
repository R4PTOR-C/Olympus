import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext();
const KEY = "olympus_theme";

function apply(theme, persist = true) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) localStorage.setItem(KEY, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1220" : "#ffffff");
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(
        document.documentElement.getAttribute("data-theme") || "light"
    );

    useEffect(() => {
        // reage a mudança do tema do SO se quiser suportar "system"
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = e => {
            const saved = localStorage.getItem(KEY);
            if (saved === "system") apply(e.matches ? "dark" : "light", false);
        };
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    const set = (t) => { setTheme(t); apply(t); };

    return <ThemeCtx.Provider value={{ theme, set }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
