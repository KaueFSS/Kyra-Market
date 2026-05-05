import { useState } from "react";

export function useCEP(onResult) {
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [erroCEP, setErroCEP] = useState("");

  async function buscarCEP(cep) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCEP(true);
    setErroCEP("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErroCEP("CEP não encontrado.");
      } else {
        onResult({ cidade: data.localidade, uf: data.uf, bairro: data.bairro || "" });
      }
    } catch {
      setErroCEP("Erro ao buscar CEP.");
    } finally {
      setBuscandoCEP(false);
    }
  }

  return { buscarCEP, buscandoCEP, erroCEP };
}
