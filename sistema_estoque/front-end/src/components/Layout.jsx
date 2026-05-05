import { useEffect, useState } from "react";
import BarraNavegacao from "./BarraNavegacao";
import Toast from "./Toast";
import SplashScreen from "./SplashScreen";
import GlobalSearch from "./GlobalSearch";
import api from "../services/api";
import { isCached, cachedGet } from "../utils/apiCache";

const PREFETCH_STEPS = [
  { url: "/vendas/?page=1",          label: "Vendas" },
  { url: "/compras/?page=1",         label: "Compras" },
  { url: "/produtos/?page=1",        label: "Produtos" },
  { url: "/estoques/?page=1",        label: "Estoques" },
  { url: "/clientes/?page=1",        label: "Clientes" },
  { url: "/funcionarios/?page=1",    label: "Funcionários" },
  { url: "/fornecedores/?page=1",    label: "Fornecedores" },
  { url: "/despesas/?page=1",        label: "Despesas" },
  { url: "/vendas/hoje/",            label: "Dashboard" },
  { url: "/estoques/alerta-minimo/", label: "Alertas" },
  { url: "/clientes/resumo/",        label: "Resumo" },
  { url: "/lucro-mensal/",           label: "Análise" },
];

function Layout({ children }) {
  const initialMask = PREFETCH_STEPS.map((s) => isCached(s.url));
  const alreadyAllCached = initialMask.every(Boolean);

  const [doneMask, setDoneMask]     = useState(initialMask);
  const [fading, setFading]         = useState(false);
  const [showSplash, setShowSplash] = useState(!alreadyAllCached);
  const [searchOpen, setSearchOpen] = useState(false);

  // Prefetch on cold cache
  useEffect(() => {
    if (alreadyAllCached) return;
    let completed = initialMask.filter(Boolean).length;
    PREFETCH_STEPS.forEach(({ url }, idx) => {
      if (initialMask[idx]) return;
      cachedGet(api, url)
        .catch(() => {})
        .finally(() => {
          completed++;
          setDoneMask((prev) => { const n = [...prev]; n[idx] = true; return n; });
          if (completed >= PREFETCH_STEPS.length) {
            setTimeout(() => setFading(true), 600);
            setTimeout(() => setShowSplash(false), 1300);
          }
        });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      // Ctrl+K → open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      // "/" → focus search bar of current page (dispatch custom event)
      if (e.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("mercadinho-focus-search"));
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen
          steps={PREFETCH_STEPS.map((s, i) => ({ label: s.label, done: doneMask[i] }))}
          fading={fading}
        />
      )}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <BarraNavegacao onOpenSearch={() => setSearchOpen(true)} />
      <main className="app-main">
        {children}
      </main>
      <Toast />
    </>
  );
}

export default Layout;
