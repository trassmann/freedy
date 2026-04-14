import { useEffect } from "react";
import { useAppStore } from "../stores/app-store";
import type { useRsvpEngine } from "./use-rsvp-engine";

type RsvpEngine = ReturnType<typeof useRsvpEngine>;

export function useKeyboard(engine: RsvpEngine | null) {
  const setView = useAppStore((s) => s.setView);
  const view = useAppStore((s) => s.view);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (view === "reader" && engine) {
        switch (e.code) {
          case "Space":
            e.preventDefault();
            engine.togglePlayPause();
            break;
          case "ArrowLeft":
            e.preventDefault();
            engine.skipBackward(e.shiftKey ? 10 : 1);
            break;
          case "ArrowRight":
            e.preventDefault();
            engine.skipForward(e.shiftKey ? 10 : 1);
            break;
          case "ArrowUp":
            e.preventDefault();
            engine.adjustWpm(25);
            break;
          case "ArrowDown":
            e.preventDefault();
            engine.adjustWpm(-25);
            break;
          case "Escape":
            e.preventDefault();
            engine.stop();
            setView("library");
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engine, view, setView]);
}
