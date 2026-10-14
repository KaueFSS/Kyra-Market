import axios from "axios";
import { MODO_DEMO } from "../demo/modo";

/**
 * Base URL dinâmica:
 *  - Acesso por localhost     → http://localhost:8000/api
 *  - Acesso por IP do Radmin  → http://26.x.x.x:8000/api
 *  - Acesso por IP da rede    → http://192.168.x.x:8000/api
 *
 * Funciona automaticamente — sem precisar trocar nada quando você
 * compartilha o link com outras pessoas via Radmin/LAN.
 */
const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";

const api = axios.create({
  baseURL: MODO_DEMO ? "/api" : `http://${host}:8000/api`,
});

// Na demonstração (GitHub Pages) não há servidor: as requisições são
// respondidas no próprio navegador por src/demo/backend.js.
if (import.meta.env.VITE_DEMO === "1") {
  api.defaults.adapter = async (config) => (await import("../demo/backend")).default(config);
}

export default api;
