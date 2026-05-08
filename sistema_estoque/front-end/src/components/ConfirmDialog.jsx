import { useEffect, useRef, useState } from "react";

export default function ConfirmDialog() {
  const [state, setState] = useState(null);
  const cancelBtnRef = useRef(null);
  const resolverRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      const { resolve, ...rest } = e.detail;
      resolverRef.current = resolve;
      setState(rest);
    }
    window.addEventListener("mercadinho-confirm", handler);
    return () => window.removeEventListener("mercadinho-confirm", handler);
  }, []);

  // Focus inicial no botão Cancelar (segurança) + ESC para cancelar + Enter para confirmar
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => cancelBtnRef.current?.focus(), 50);

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); fechar(false); }
      if (e.key === "Enter")  { e.preventDefault(); fechar(true);  }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function fechar(result) {
    if (resolverRef.current) resolverRef.current(result);
    resolverRef.current = null;
    setState(null);
  }

  if (!state) return null;

  return (
    <div className="confirm-overlay" onMouseDown={() => fechar(false)} role="dialog" aria-modal="true">
      <div className="confirm-modal" onMouseDown={(e) => e.stopPropagation()}>

        <div className={`confirm-icon-wrap${state.danger ? " danger" : ""}`}>
          {state.danger ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9"  x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8"  x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h3 className="confirm-title">{state.title}</h3>
        <p  className="confirm-message">{state.message}</p>

        <div className="confirm-actions">
          <button
            type="button"
            ref={cancelBtnRef}
            className="confirm-btn confirm-btn-cancel"
            onClick={() => fechar(false)}
          >
            {state.cancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn ${state.danger ? "confirm-btn-danger" : "confirm-btn-primary"}`}
            onClick={() => fechar(true)}
          >
            {state.confirmText}
          </button>
        </div>

        <span className="confirm-shortcut-hint">
          <kbd>Enter</kbd> confirmar &nbsp;·&nbsp; <kbd>Esc</kbd> cancelar
        </span>
      </div>
    </div>
  );
}
