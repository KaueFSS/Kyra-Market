import api from "../services/api";

/**
 * Cache HTTP inteligente:
 *  - Deduplicação de requests em voo (5 chamadas simultâneas = 1 request)
 *  - Stale-While-Revalidate: devolve cache imediato e atualiza em background
 *  - TTL configurável; após o TTL revalida; após o "hardTTL" descarta
 */

const _cache    = new Map(); // url → { res, ts }
const _inflight = new Map(); // url → Promise (request em voo)

const TTL       = 5 * 60 * 1000;     // 5 min: usa cache "fresco"
const HARD_TTL  = 60 * 60 * 1000;    // 1h:   após isso o cache é jogado fora

function isFresh(hit)  { return hit && Date.now() - hit.ts < TTL; }
function isUsable(hit) { return hit && Date.now() - hit.ts < HARD_TTL; }

async function _fetchAndStore(apiInstance, url) {
  // Deduplicação: se já tem request em voo, reusa
  if (_inflight.has(url)) return _inflight.get(url);

  const promise = apiInstance.get(url)
    .then((res) => {
      _cache.set(url, { res, ts: Date.now() });
      _inflight.delete(url);
      return res;
    })
    .catch((err) => {
      _inflight.delete(url);
      throw err;
    });

  _inflight.set(url, promise);
  return promise;
}

/**
 * GET com cache + SWR.
 * - Se cache fresco → retorna imediato
 * - Se cache stale (entre TTL e HARD_TTL) → retorna stale e revalida em background
 * - Se sem cache (ou hard expirado) → faz request normal
 */
export async function cachedGet(apiInstance, url) {
  const hit = _cache.get(url);

  if (isFresh(hit)) return hit.res;

  if (isUsable(hit)) {
    // Stale-while-revalidate: devolve cache, atualiza em fundo
    _fetchAndStore(apiInstance, url).catch(() => {});
    return hit.res;
  }

  return _fetchAndStore(apiInstance, url);
}

/* Retorna do cache sincronamente (para render inicial sem await) */
export function getSync(url) {
  const hit = _cache.get(url);
  return isUsable(hit) ? hit.res : null;
}

/* Verifica se existe cache utilizável */
export function isCached(url) {
  return isUsable(_cache.get(url));
}

/* Busca em background sem bloquear (usado em hover/preload) */
export function prefetch(url) {
  if (isFresh(_cache.get(url))) return;
  _fetchAndStore(api, url).catch(() => {});
}

/* Invalida cache (uma URL ou tudo) */
export function invalidateCache(url) {
  if (url) {
    // Invalida a URL exata e suas variações de página
    for (const key of _cache.keys()) {
      if (key === url || key.startsWith(url.split("?")[0])) {
        _cache.delete(key);
      }
    }
  } else {
    _cache.clear();
  }
}

/* Itens cacheados de uma URL (para busca global) */
export function getCachedSection(url) {
  const hit = _cache.get(url);
  if (!isUsable(hit)) return [];
  return parseListResponse(hit.res).data;
}

/* Extrai array + paginação de qualquer resposta */
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
