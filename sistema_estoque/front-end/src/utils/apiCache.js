import api from "../services/api";

const _cache = new Map();
const TTL = 4 * 60 * 60_000; // 4 horas

/* Lê e retorna do cache se válido, senão faz a requisição e guarda */
export async function cachedGet(apiInstance, url) {
  const hit = _cache.get(url);
  if (hit && Date.now() - hit.ts < TTL) return hit.res;
  const res = await apiInstance.get(url);
  _cache.set(url, { res, ts: Date.now() });
  return res;
}

/* Retorna resposta cacheada SINCRONAMENTE (null se expirada/ausente) */
export function getSync(url) {
  const hit = _cache.get(url);
  return hit && Date.now() - hit.ts < TTL ? hit.res : null;
}

/* Verifica se a URL está no cache válido */
export function isCached(url) {
  const hit = _cache.get(url);
  return !!(hit && Date.now() - hit.ts < TTL);
}

/* Busca em background sem bloquear; ignora erro silenciosamente */
export function prefetch(url) {
  if (isCached(url)) return;
  api.get(url)
    .then((res) => _cache.set(url, { res, ts: Date.now() }))
    .catch(() => {});
}

/* Invalida uma URL (ou tudo se url omitida) */
export function invalidateCache(url) {
  if (url) _cache.delete(url);
  else _cache.clear();
}

/* Retorna os itens cacheados de uma URL específica (para busca global) */
export function getCachedSection(url) {
  const hit = _cache.get(url);
  if (!hit || Date.now() - hit.ts >= TTL) return [];
  return parseListResponse(hit.res).data;
}

/* Extrai array + paginação de qualquer resposta da API */
export function parseListResponse(res) {
  if (!res) return { data: [], next: null, previous: null };
  const d = res.data;
  if (Array.isArray(d)) return { data: d, next: null, previous: null };
  return {
    data: d.results || [],
    next: d.next ?? null,
    previous: d.previous ?? null,
  };
}
