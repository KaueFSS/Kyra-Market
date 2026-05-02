import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

const estadoInicial = {
  venda: "",
  produto: "",
  quantidade_vendida: "",
  desconto_aplicado: "0",
};

function CadastrarItemVenda() {
  const [item, setItem] = useState(estadoInicial);
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const ven = await listarDados("/vendas/");
        const prod = await listarDados("/produtos/");
        setVendas(ven);
        setProdutos(prod);
      } catch (err) {
        console.error(err);
      }
    }
    carregarDados();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "produto") {
      const produtoSelecionado = produtos.find((p) => p.id_produto === value);
      setPrecoUnitario(produtoSelecionado ? parseFloat(produtoSelecionado.preco) : 0);
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

    const dadosParaEnviar = {
      venda: item.venda,
      produto: item.produto,
      quantidade_vendida: qtd,
      preco_unitario: precoUnitario,
      desconto_aplicado: descontoValor,
      subtotal,
    };

    try {
      await criarDado("/itens-venda/", dadosParaEnviar);
      setMensagem("Item adicionado à venda com sucesso!");
      setErro("");
      setItem(estadoInicial);
      setPrecoUnitario(0);
    } catch (err) {
      const msg = err.response?.data?.erro || "Erro ao cadastrar o item da venda.";
      setErro(msg);
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Item de Venda</h1>
      <p>Formulário para adicionar produtos a uma venda existente.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormSelect
          label="Venda"
          name="venda"
          value={item.venda}
          onChange={handleChange}
          options={vendas.map((v) => ({
            value: v.id_venda,
            label: v.nome || `Venda ${v.id_venda} — ${v.data_venda}`,
          }))}
        />

        <FormSelect
          label="Produto"
          name="produto"
          value={item.produto}
          onChange={handleChange}
          options={produtos.map((p) => ({
            value: p.id_produto,
            label: `${p.nome} — R$ ${parseFloat(p.preco).toFixed(2)}`,
          }))}
        />

        <FormInput
          label="Quantidade"
          name="quantidade_vendida"
          type="number"
          min="1"
          value={item.quantidade_vendida}
          onChange={handleChange}
          required={true}
        />

        <div style={{ marginBottom: "15px" }}>
          <label>Preço Unitário (R$)</label>
          <br />
          <input
            type="text"
            value={precoUnitario.toFixed(2)}
            disabled
            style={{
              padding: "8px",
              width: "270px",
              borderRadius: "6px",
              border: "1px solid #555",
              marginTop: "5px",
              backgroundColor: "#2a2a3e",
              color: "#aaa",
              cursor: "not-allowed",
            }}
          />
          <small style={{ display: "block", color: "#888", marginTop: "4px" }}>
            Preenchido automaticamente ao selecionar o produto
          </small>
        </div>

        <FormInput
          label="Desconto (%)"
          name="desconto_aplicado"
          type="number"
          step="1"
          min="0"
          max="100"
          value={item.desconto_aplicado}
          onChange={handleChange}
          placeholder="Ex: 10"
        />

        <div style={{ marginBottom: "15px" }}>
          <label>Subtotal (R$)</label>
          <br />
          <input
            type="text"
            value={subtotal >= 0 ? subtotal.toFixed(2) : "0.00"}
            disabled
            style={{
              padding: "8px",
              width: "270px",
              borderRadius: "6px",
              border: "1px solid #555",
              marginTop: "5px",
              backgroundColor: "#2a2a3e",
              color: subtotal >= 0 ? "#4ade80" : "#f87171",
              fontWeight: "bold",
              cursor: "not-allowed",
            }}
          />
        </div>

        <BotaoSalvar texto="Adicionar à Venda" />
      </form>
    </div>
  );
}

export default CadastrarItemVenda;
