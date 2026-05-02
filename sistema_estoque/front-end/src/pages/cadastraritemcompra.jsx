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
    setItem({ ...item, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await criarDado("/itens-compra/", item);
      setMensagem("Item de compra cadastrado com sucesso!");
      setErro("");
      setItem(estadoInicial);
    } catch (err) {
      setErro("Erro ao cadastrar item de compra.");
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
            label: p.nome,
          }))}
        />

        <FormInput
          label="Quantidade"
          name="quantidade"
          type="number"
          value={item.quantidade}
          onChange={handleChange}
        />

        <FormInput
          label="Preço Unitário"
          name="valor_unitario"
          type="number"
          value={item.valor_unitario}
          onChange={handleChange}
        />

        <BotaoSalvar texto="Cadastrar Item" />
      </form>
    </div>
  );
}

export default CadastrarItemCompra;