import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

function EditarEstoque() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/estoques/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/estoques/${id}/`, {
        quantidade_atual: parseInt(form.quantidade_atual),
        quantidade_minima: parseInt(form.quantidade_minima),
        dt_ultima_entrada: form.dt_ultima_entrada || null,
        dt_ultima_saida: form.dt_ultima_saida || null,
      });
      setMensagem("Estoque atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar estoque.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Estoque</h1>
      <p style={{ color: "#aaa" }}>Produto: <strong style={{ color: "white" }}>{form.produto_nome || form.produto}</strong></p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Quantidade Atual" name="quantidade_atual" type="number" min="0" value={form.quantidade_atual} onChange={handleChange} required />
        <FormInput label="Quantidade Mínima" name="quantidade_minima" type="number" min="0" value={form.quantidade_minima} onChange={handleChange} required />
        <FormInput label="Última Entrada" name="dt_ultima_entrada" type="date" value={form.dt_ultima_entrada || ""} onChange={handleChange} />
        <FormInput label="Última Saída" name="dt_ultima_saida" type="date" value={form.dt_ultima_saida || ""} onChange={handleChange} />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/estoques")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarEstoque;
