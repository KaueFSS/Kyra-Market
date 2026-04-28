import api from "./api";

export async function listarDados(endpoint) {
  const response = await api.get(endpoint);

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data.results) {
    return response.data.results;
  }

  return [];
}

export async function criarDado(endpoint, dados) {
  const response = await api.post(endpoint, dados);
  return response.data;
}

export async function atualizarDado(endpoint, id, dados) {
  const response = await api.patch(`${endpoint}${id}/`, dados);
  return response.data;
}

export async function deletarDado(endpoint, id) {
  const response = await api.delete(`${endpoint}${id}/`);
  return response.data;
}