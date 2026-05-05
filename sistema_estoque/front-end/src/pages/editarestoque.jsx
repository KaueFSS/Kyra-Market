import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function EditarEstoque() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/estoques") });

  useEffect(() => {
    api.get(`/estoques/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      await api.patch(`/estoques/${id}/`, {
        quantidade_atual: parseInt(form.quantidade_atual),
        quantidade_minima: parseInt(form.quantidade_minima),
        dt_ultima_entrada: form.dt_ultima_entrada || null,
        dt_ultima_saida: form.dt_ultima_saida || null,
      });
      invalidateCache("/estoques/?page=1");
      showToast("Estoque atualizado com sucesso!", "success");
      setTimeout(() => navigate(`/estoques?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar estoque.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  const baixo = parseInt(form.quantidade_atual) < parseInt(form.quantidade_minima);

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Estoque</h1>
      <p className="page-subtitle">
        Produto: <strong style={{ color: "var(--text-primary)" }}>{form.produto_nome || form.produto}</strong>
        {" — "}
        <span className={`badge ${baixo ? "badge-red" : "badge-green"}`}>
          {baixo ? "⚠ Abaixo do mínimo" : "✓ OK"}
        </span>
      </p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormInput label="Quantidade Atual" name="quantidade_atual" type="number" value={form.quantidade_atual} onChange={handleChange} required />
        <FormInput label="Quantidade Mínima" name="quantidade_minima" type="number" value={form.quantidade_minima} onChange={handleChange} required />
        <FormInput label="Última Entrada" name="dt_ultima_entrada" type="date" value={form.dt_ultima_entrada || ""} onChange={handleChange} />
        <FormInput label="Última Saída" name="dt_ultima_saida" type="date" value={form.dt_ultima_saida || ""} onChange={handleChange} />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/estoques")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarEstoque;
