import { useEffect, useState } from "react";
import BarraNavegacao from "./BarraNavegacao";
import Toast from "./Toast";
import GlobalSearch from "./GlobalSearch";
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

  // Prefetch silenciosamente em background (sem splash)
  useEffect(() => {
    PREFETCH_URLS.forEach((url) => cachedGet(api, url).catch(() => {}));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
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

  return (
    <>
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
