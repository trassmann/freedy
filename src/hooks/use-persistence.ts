import { useEffect, useRef } from "react";
import { useAppStore } from "../stores/app-store";

let storeInstance: Awaited<ReturnType<typeof import("@tauri-apps/plugin-store")["load"]>> | null = null;

async function getStore() {
  if (storeInstance) return storeInstance;
  const { load } = await import("@tauri-apps/plugin-store");
  storeInstance = await load("freedy-data.json", { defaults: {}, autoSave: false });
  return storeInstance;
}

export function usePersistence() {
  const library = useAppStore((s) => s.library);
  const settings = useAppStore((s) => s.settings);
  const setLibrary = useAppStore((s) => s.setLibrary);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const loadedRef = useRef(false);

  // Load on mount
  useEffect(() => {
    async function loadState() {
      try {
        const store = await getStore();
        const savedLibrary = await store.get("library");
        const savedSettings = await store.get("settings");

        if (Array.isArray(savedLibrary)) {
          setLibrary(savedLibrary);
        }
        if (savedSettings && typeof savedSettings === "object") {
          updateSettings(savedSettings as Record<string, unknown>);
        }
      } catch (e) {
        console.warn("Failed to load persisted state:", e);
      }
      loadedRef.current = true;
    }
    loadState();
  }, [setLibrary, updateSettings]);

  // Save when library or settings change (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loadedRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const store = await getStore();
        await store.set("library", library);
        await store.set("settings", settings);
        await store.save();
      } catch (e) {
        console.warn("Failed to save state:", e);
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [library, settings]);
}
