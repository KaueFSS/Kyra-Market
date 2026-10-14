// Ligado só no build da demonstração (npm run build:demo → .env.demo).
export const MODO_DEMO = import.meta.env.VITE_DEMO === "1";

// Caminho de arquivos de public/ respeitando a base do build (GitHub Pages).
export const asset = (arquivo) => `${import.meta.env.BASE_URL}${arquivo}`;
