import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

const estadoInicial = {
  compra: "",
  produto: "",
  quantidade: "",
  valor_unitario: "",
};

function CadastrarItemCompra() {
  const [item, setItem] = useState(estadoInicial);
  const [compras, setCompras] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const comp = await listarDados("/compras/");
        const prod = await listarDados("/produtos/");
        setCompras(comp.results || comp);
        setProdutos(prod.results || prod);
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
      setItem((prev) => ({
        ...prev,
        produto: value,
        valor_unitario: produtoSelecionado
          ? parseFloat(produtoSelecionado.preco_custo).toFixed(2)
          : "",
      }));
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
      await criarDado("/itens-compra/", {
        ...item,
        quantidade: qtd,
        valor_unitario: preco,
      });
      setMensagem("Item de compra cadastrado com sucesso!");
      setErro("");
      setItem(estadoInicial);
    } catch (err) {
      const msg = err.response?.data?.erro || "Erro ao cadastrar item de compra.";
      setErro(msg);
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Item de Compra</h1>
      <p>Formulário para adicionar produtos a uma compra.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormSelect
          label="Compra"
          name="compra"
          value={item.compra}
          onChange={handleChange}
          options={compras.map((c) => ({
            value: c.id_compra,
            label: c.nome || `${c.fornecedor_nome || c.id_compra} — ${c.data_compra}`,
          }))}
        />

        <FormSelect
          label="Produto"
          name="produto"
          value={item.produto}
          onChange={handleChange}
          options={produtos.map((p) => ({
            value: p.id_produto,
            label: `${p.nome} — Custo: R$ ${parseFloat(p.preco_custo).toFixed(2)}`,
          }))}
        />

        <FormInput
          label="Quantidade"
          name="quantidade"
          type="number"
          min="1"
          value={item.quantidade}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Valor Unitário (R$)"
          name="valor_unitario"
          type="number"
          step="0.01"
          min="0"
          value={item.valor_unitario}
          onChange={handleChange}
          required={true}
        />
        <small style={{ display: "block", color: "#888", marginTop: "-10px", marginBottom: "15px" }}>
          Preenchido automaticamente com o preço de custo. Pode ser alterado.
        </small>

        <div style={{ marginBottom: "15px" }}>
          <label>Subtotal (R$)</label>
          <br />
          <input
            type="text"
            value={subtotal.toFixed(2)}
            disabled
            style={{
              padding: "8px",
              width: "270px",
              borderRadius: "6px",
              border: "1px solid #555",
              marginTop: "5px",
              backgroundColor: "#2a2a3e",
              color: "#4ade80",
              fontWeight: "bold",
              cursor: "not-allowed",
            }}
          />
        </div>

        <BotaoSalvar texto="Cadastrar Item" />
      </form>
    </div>
  );
}

export default CadastrarItemCompra;
