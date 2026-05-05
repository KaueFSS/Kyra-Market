import { useEffect, useState } from "react";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...e.detail }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }
    window.addEventListener("mercadinho-toast", handler);
    return () => window.removeEventListener("mercadinho-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.message}
        </div>
      ))}
    </div>
  );
}
