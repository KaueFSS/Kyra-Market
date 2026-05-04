import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

function gerarIdCompra() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return "CMP" + sufixo;
}

const estadoInicialCompra = {
  nome: "",
  fornecedor: "",
  funcionario: "",
  data_compra: new Date().toISOString().split("T")[0],
  status: "Pendente",
  data_entrega: "",
};

const estadoInicialItem = {
  produto: "",
  quantidade_comprada: "",
  preco_unitario: "",
};

function CadastrarCompra() {
  const [compra, setCompra] = useState(estadoInicialCompra);
  const [itemAtual, setItemAtual] = useState(estadoInicialItem);
  const [itens, setItens] = useState([]);

  const [fornecedores, setFornecedores] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const forn = await listarDados("/fornecedores/");
        const func = await listarDados("/funcionarios/");
        const prod = await listarDados("/produtos/");

        setFornecedores(forn.results || forn);
        setFuncionarios(func.results || func);
        setProdutos(prod.results || prod);
      } catch (err) {
        console.error(err);
      }
    }

    carregarDados();
  }, []);

  function handleChangeCompra(e) {
    setCompra({ ...compra, [e.target.name]: e.target.value });
  }

  function handleChangeItem(e) {
    setItemAtual({ ...itemAtual, [e.target.name]: e.target.value });
  }

  function adicionarItem() {
    if (!itemAtual.produto || !itemAtual.quantidade_comprada || !itemAtual.preco_unitario) {
      setErro("Preencha todos os campos do item.");
      return;
    }

    setItens([...itens, itemAtual]);
    setItemAtual(estadoInicialItem);
    setErro("");
  }

  function calcularTotal() {
    return itens.reduce(
      (acc, item) =>
        acc + item.quantidade_comprada * item.preco_unitario,
      0
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (itens.length === 0) {
      setErro("Adicione pelo menos um item à compra.");
      return;
    }

    try {
      const novaCompra = await criarDado("/compras/", {
        ...compra,
        id_compra: gerarIdCompra(),
        valor_total: calcularTotal(),
      });

      for (let item of itens) {
        await criarDado("/itens-compra/", {
          ...item,
          compra: novaCompra.id_compra,
        });
      }

      setMensagem("Compra cadastrada com sucesso!");
      setErro("");
      setCompra(estadoInicialCompra);
      setItens([]);
    } catch (err) {
      console.error(err);
      setErro("Erro ao cadastrar compra.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Compra</h1>
      <p>Preencha os dados da compra e adicione itens.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <h2>Dados da Compra</h2>

        <FormInput
          label="Nome"
          name="nome"
          value={compra.nome}
          onChange={handleChangeCompra}
        />

        <FormSelect
          label="Fornecedor"
          name="fornecedor"
          value={compra.fornecedor}
          onChange={handleChangeCompra}
          options={fornecedores.map((f) => ({
            value: f.id_fornecedor,
            label: f.nome_fantasia,
          }))}
        />

        <FormSelect
          label="Funcionário"
          name="funcionario"
          value={compra.funcionario}
          onChange={handleChangeCompra}
          options={funcionarios.map((f) => ({
            value: f.id_funcionario,
            label: f.nome,
          }))}
        />

        <FormInput
          label="Data da Compra"
          name="data_compra"
          type="date"
          value={compra.data_compra}
          onChange={handleChangeCompra}
        />

        <FormSelect
          label="Status"
          name="status"
          value={compra.status}
          onChange={handleChangeCompra}
          options={[
            { value: "Pendente", label: "Pendente" },
            { value: "Entregue", label: "Entregue" },
          ]}
        />

        <FormInput
          label="Data de Entrega"
          name="data_entrega"
          type="date"
          value={compra.data_entrega}
          onChange={handleChangeCompra}
        />

        <hr />

        <h2>Adicionar Item</h2>

        <FormSelect
          label="Produto"
          name="produto"
          value={itemAtual.produto}
          onChange={handleChangeItem}
          options={produtos.map((p) => ({
            value: p.id_produto,
            label: p.nome,
          }))}
        />

        <FormInput
          label="Quantidade"
          name="quantidade_comprada"
          type="number"
          value={itemAtual.quantidade_comprada}
          onChange={handleChangeItem}
        />

        <FormInput
          label="Preço Unitário"
          name="preco_unitario"
          type="number"
          value={itemAtual.preco_unitario}
          onChange={handleChangeItem}
        />

        <button type="button" onClick={adicionarItem}>
          Adicionar Item
        </button>

        <h3>Itens adicionados</h3>

        <ul>
          {itens.map((item, index) => (
            <li key={index}>
              {item.produto} - {item.quantidade_comprada} x {item.preco_unitario}
            </li>
          ))}
        </ul>

        <h3>Total: R$ {calcularTotal().toFixed(2)}</h3>

        <BotaoSalvar texto="Cadastrar Compra" />
      </form>
    </div>
  );
}

export default CadastrarCompra;