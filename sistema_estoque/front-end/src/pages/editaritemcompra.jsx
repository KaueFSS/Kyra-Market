import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { formatarMoeda } from "../utils/formatadores";

function EditarItemCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/itens-compra/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/itens-compra/${id}/`, {
        quantidade: parseInt(form.quantidade),
        valor_unitario: parseFloat(form.valor_unitario),
      });
      setMensagem("Item atualizado com sucesso!");
      setErro("");
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao atualizar item de compra.");
      setMensagem("");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  const total = (parseInt(form.quantidade) || 0) * (parseFloat(form.valor_unitario) || 0);

  return (
    <div className="page-container">
      <h1 className="page-title">Editar item de compra</h1>
      <p className="page-subtitle">
        Compra: <strong>{form.compra}</strong>
        {" | "}
        Produto: <strong>{form.produto_nome || form.produto}</strong>
      </p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Quantidade" name="quantidade" type="number" value={form.quantidade} onChange={handleChange} required />
        <FormInput label="Valor unitário (R$)" name="valor_unitario" type="number" step="0.01" value={form.valor_unitario} onChange={handleChange} required />

        <div className="form-group">
          <label className="form-label">Total calculado</label>
          <div className="form-readonly form-readonly-strong">
            {formatarMoeda(total)}
          </div>
        </div>

        <div className="form-actions">
          <BotaoSalvar texto="Salvar alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/itens-compra")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarItemCompra;
