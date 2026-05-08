import { useEffect, useState } from "react";
import BarraNavegacao from "./BarraNavegacao";
import Toast from "./Toast";
import GlobalSearch from "./GlobalSearch";
import ConfirmDialog from "./ConfirmDialog";
import api from "../services/api";
import { cachedGet } from "../utils/apiCache";

const PREFETCH_URLS = [
  "/vendas/?page=1",
  "/compras/?page=1",
  "/produtos/?page=1",
  "/estoques/?page=1",
  "/clientes/?page=1",
  "/funcionarios/?page=1",
  "/fornecedores/?page=1",
  "/despesas/?page=1",
  "/vendas/hoje/",
  "/estoques/alerta-minimo/",
  "/clientes/resumo/",
  "/lucro-mensal/",
];

function Layout({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Prefetch silenciosamente em background
  useEffect(() => {
    PREFETCH_URLS.forEach((url) => cachedGet(api, url).catch(() => {}));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Atalhos globais
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("mercadinho-focus-search"));
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Spotlight: luz seguindo o cursor sobre cards (estilo Linear/Stripe).
  // Throttled via requestAnimationFrame — sem overhead perceptível.
  useEffect(() => {
    let rafId = null;
    let lastEvent = null;

    function process() {
      rafId = null;
      if (!lastEvent) return;
      const ev = lastEvent;
      const cards = document.querySelectorAll(".stat-card, .quicknav-card, .home-panel");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const inside =
          ev.clientX >= rect.left &&
          ev.clientX <= rect.right &&
          ev.clientY >= rect.top &&
          ev.clientY <= rect.bottom;
        if (inside) {
          card.style.setProperty("--mx", `${ev.clientX - rect.left}px`);
          card.style.setProperty("--my", `${ev.clientY - rect.top}px`);
          if (!card.classList.contains("has-spotlight")) {
            card.classList.add("has-spotlight");
          }
        } else if (card.classList.contains("has-spotlight")) {
          card.classList.remove("has-spotlight");
        }
      });
    }

    function onMove(e) {
      lastEvent = e;
      if (rafId == null) rafId = requestAnimationFrame(process);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BarraNavegacao onOpenSearch={() => setSearchOpen(true)} />
      <main className="app-main">
        {children}
      </main>
      <Toast />
      <ConfirmDialog />
    </>
  );
}

export default Layout;
