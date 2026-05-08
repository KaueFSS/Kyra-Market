import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { formatarMoeda } from "../utils/formatadores";
import { formatarErroAPI } from "../utils/errosApi";

const estadoInicial = { compra: "", produto: "", quantidade: "", valor_unitario: "" };

function CadastrarItemCompra() {
  const [item, setItem] = useState(estadoInicial);
  const [compras, setCompras] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const [comp, prod] = await Promise.all([listarDados("/compras/"), listarDados("/produtos/")]);
      setCompras(comp.results || comp);
      setProdutos(prod.results || prod);
    }
    carregarDados();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "produto") {
      const p = produtos.find((p) => p.id_produto === value);
      setItem((prev) => ({ ...prev, produto: value, valor_unitario: p ? parseFloat(p.preco_custo).toFixed(2) : "" }));
      return;
    }
    setItem((prev) => ({ ...prev, [name]: value }));
  }

  const qtd = parseFloat(item.quantidade) || 0;
  const preco = parseFloat(item.valor_unitario) || 0;
  const subtotal = qtd * preco;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await criarDado("/itens-compra/", { ...item, quantidade: qtd, valor_unitario: preco });
      setMensagem("Item de compra cadastrado com sucesso!");
      setErro("");
      setItem(estadoInicial);
    } catch (err) {
      setErro(formatarErroAPI(err, "Erro ao cadastrar item de compra."));
      setMensagem("");
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Item de Compra</h1>
      <p className="page-subtitle">Formulário para adicionar produtos a uma compra.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormSelect label="Compra" name="compra" value={item.compra} onChange={handleChange}
          options={compras.map((c) => ({ value: c.id_compra, label: c.nome || `${c.fornecedor_nome || c.id_compra} — ${c.data_compra}` }))}
        />
        <FormSelect label="Produto" name="produto" value={item.produto} onChange={handleChange}
          options={produtos.map((p) => ({ value: p.id_produto, label: `${p.nome} — Custo: ${formatarMoeda(p.preco_custo)}` }))}
        />
        <FormInput label="Quantidade" name="quantidade" type="number" value={item.quantidade} onChange={handleChange} required />
        <FormInput label="Valor Unitário (R$)" name="valor_unitario" type="number" step="0.01" value={item.valor_unitario} onChange={handleChange} required />
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: -8, marginBottom: 12 }}>
          Preenchido automaticamente com o preço de custo. Pode ser alterado.
        </p>

        <div className="form-group">
          <label className="form-label">Subtotal calculado</label>
          <div style={{ padding: "9px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-input)", border: "1px solid var(--border-input)", color: "var(--accent-green)", fontWeight: 600, maxWidth: 400 }}>
            {formatarMoeda(subtotal)}
          </div>
        </div>

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Item" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarItemCompra;
