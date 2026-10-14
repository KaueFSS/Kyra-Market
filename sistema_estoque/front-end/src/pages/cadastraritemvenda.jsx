import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { formatarMoeda } from "../utils/formatadores";
import { formatarErroAPI } from "../utils/errosApi";

const estadoInicial = { venda: "", produto: "", quantidade_vendida: "", desconto_aplicado: "0" };

function CadastrarItemVenda() {
  const [item, setItem] = useState(estadoInicial);
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const [ven, prod] = await Promise.all([listarDados("/vendas/"), listarDados("/produtos/")]);
      setVendas(ven);
      setProdutos(prod);
    }
    carregarDados();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "produto") {
      const p = produtos.find((p) => p.id_produto === value);
      setPrecoUnitario(p ? parseFloat(p.preco) : 0);
    }
    setItem((prev) => ({ ...prev, [name]: value }));
  }

  const qtd = parseInt(item.quantidade_vendida, 10) || 0;
  const descontoPct = parseFloat(item.desconto_aplicado) || 0;
  const totalBruto = qtd * precoUnitario;
  const descontoValor = totalBruto * (descontoPct / 100);
  const subtotal = totalBruto - descontoValor;

  async function handleSubmit(e) {
    e.preventDefault();
    if (subtotal < 0) {
      setErro("O desconto não pode ser maior que o valor total dos produtos.");
      return;
    }
    try {
      await criarDado("/itens-venda/", {
        venda: item.venda, produto: item.produto,
        quantidade_vendida: qtd, preco_unitario: precoUnitario,
        desconto_aplicado: descontoValor, subtotal,
      });
      setMensagem("Item adicionado à venda com sucesso!");
      setErro("");
      setItem(estadoInicial);
      setPrecoUnitario(0);
    } catch (err) {
      setErro(formatarErroAPI(err, "Erro ao cadastrar o item da venda."));
      setMensagem("");
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar item de venda</h1>
      <p className="page-subtitle">Formulário para adicionar produtos a uma venda existente.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormSelect label="Venda" name="venda" value={item.venda} onChange={handleChange}
          options={vendas.map((v) => ({ value: v.id_venda, label: v.nome || `Venda ${v.id_venda} — ${v.data_venda}` }))}
        />
        <FormSelect label="Produto" name="produto" value={item.produto} onChange={handleChange}
          options={produtos.map((p) => ({ value: p.id_produto, label: `${p.nome} — ${formatarMoeda(p.preco)}` }))}
        />
        <FormInput label="Quantidade" name="quantidade_vendida" type="number" value={item.quantidade_vendida} onChange={handleChange} required />

        <div className="form-group">
          <label className="form-label">Preço unitário (R$)</label>
          <div className="form-readonly">
            {formatarMoeda(precoUnitario)}
          </div>
          <p className="form-field-hint">Preenchido automaticamente ao selecionar o produto</p>
        </div>

        <FormInput label="Desconto (%)" name="desconto_aplicado" type="number" step="1" value={item.desconto_aplicado} onChange={handleChange} placeholder="Ex: 10" />

        <div className="form-group">
          <label className="form-label">Subtotal calculado</label>
          <div className={`form-readonly form-readonly-strong${subtotal < 0 ? " is-negative" : ""}`}>
            {formatarMoeda(subtotal >= 0 ? subtotal : 0)}
          </div>
        </div>

        <div className="form-actions">
          <BotaoSalvar texto="Adicionar à venda" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarItemVenda;
