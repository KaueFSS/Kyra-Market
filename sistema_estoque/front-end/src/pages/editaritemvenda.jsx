import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { formatarMoeda } from "../utils/formatadores";

function EditarItemVenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/itens-venda/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const qtd = parseInt(form?.quantidade_vendida) || 0;
  const preco = parseFloat(form?.preco_unitario) || 0;
  const descontoValor = parseFloat(form?.desconto_aplicado) || 0;
  const totalBruto = qtd * preco;
  const subtotal = totalBruto - descontoValor;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/itens-venda/${id}/`, {
        quantidade_vendida: qtd,
        preco_unitario: preco,
        desconto_aplicado: descontoValor,
      });
      setMensagem("Item atualizado com sucesso!");
      setErro("");
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao atualizar item de venda.");
      setMensagem("");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Item de Venda</h1>
      <p className="page-subtitle">
        Venda: <strong style={{ color: "var(--text-primary)" }}>{form.venda}</strong>
        {" | "}
        Produto: <strong style={{ color: "var(--text-primary)" }}>{form.produto_nome || form.produto}</strong>
      </p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Quantidade" name="quantidade_vendida" type="number" value={form.quantidade_vendida} onChange={handleChange} required />

        <div className="form-group">
          <label className="form-label">Preço Unitário (R$)</label>
          <div style={{ padding: "9px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-input)", border: "1px solid var(--border-input)", color: "var(--text-secondary)", maxWidth: 400 }}>
            {formatarMoeda(preco)}
          </div>
        </div>

        <FormInput label="Desconto (R$)" name="desconto_aplicado" type="number" step="0.01" value={form.desconto_aplicado} onChange={handleChange} />

        <div className="form-group">
          <label className="form-label">Subtotal calculado</label>
          <div style={{ padding: "9px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-input)", border: "1px solid var(--border-input)", color: "var(--accent-green)", fontWeight: 600, maxWidth: 400 }}>
            {formatarMoeda(subtotal)}
          </div>
        </div>

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/itens-venda")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarItemVenda;
