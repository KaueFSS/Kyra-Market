import { useEffect } from "react";

/**
 * Atalhos de teclado para formulários:
 *   Ctrl+Enter  → chama onSubmit
 *   Escape      → chama onCancel
 */
export function useFormShortcuts({ onSubmit, onCancel } = {}) {
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
      if (e.key === "Escape") {
        onCancel?.();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSubmit, onCancel]);
}
