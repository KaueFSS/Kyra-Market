import axios from "axios";

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
  baseURL: `http://${host}:8000/api`,
});

export default api;
