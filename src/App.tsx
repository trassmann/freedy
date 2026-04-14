import { useEffect } from "react";
import { Library } from "./components/Library";
import { Reader } from "./components/Reader";
import { usePersistence } from "./hooks/use-persistence";
import { useAppStore } from "./stores/app-store";

export default function App() {
  const view = useAppStore((s) => s.view);
  const settings = useAppStore((s) => s.settings);

  // Initialize persistence (load/save library + settings)
  usePersistence();

  // Dark mode management
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode === "dark") {
      root.classList.add("dark");
    } else if (settings.darkMode === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const update = () => {
        if (mq.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };
      update();
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, [settings.darkMode]);

  return (
    <div className="h-full bg-surface text-on-surface">
      {view === "library" ? <Library /> : <Reader />}
    </div>
  );
}
