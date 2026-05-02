import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

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
  const descontoPct = parseFloat(form?.desconto_aplicado) || 0;
  const totalBruto = qtd * preco;
  const descontoValor = totalBruto * (descontoPct / 100);
  const subtotal = totalBruto - descontoValor;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/itens-venda/${id}/`, {
        quantidade_vendida: qtd,
        preco_unitario: preco,
        desconto_aplicado: descontoValor,
        subtotal,
      });
      setMensagem("Item atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar item de venda.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Item de Venda</h1>
      <p style={{ color: "#aaa" }}>Venda: <strong style={{ color: "white" }}>{form.venda}</strong> | Produto: <strong style={{ color: "white" }}>{form.produto_nome || form.produto}</strong></p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Quantidade" name="quantidade_vendida" type="number" min="1" value={form.quantidade_vendida} onChange={handleChange} required />

        <div style={{ marginBottom: "15px" }}>
          <label>Preço Unitário (R$)</label><br />
          <input type="text" value={preco.toFixed(2)} disabled
            style={{ padding: "8px", width: "270px", borderRadius: "6px", border: "1px solid #555", marginTop: "5px", backgroundColor: "#2a2a3e", color: "#aaa" }}
          />
        </div>

        <FormInput label="Desconto (%)" name="desconto_aplicado" type="number" step="1" min="0" max="100" value={form.desconto_aplicado} onChange={handleChange} />

        <div style={{ marginBottom: "15px" }}>
          <label>Subtotal</label><br />
          <input type="text" value={`R$ ${subtotal.toFixed(2)}`} disabled
            style={{ padding: "8px", width: "270px", borderRadius: "6px", border: "1px solid #555", marginTop: "5px", backgroundColor: "#2a2a3e", color: "#4ade80", fontWeight: "bold" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/itens-venda")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarItemVenda;
