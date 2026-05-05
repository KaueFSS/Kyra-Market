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

function gerarIdDespesa() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return "DESP" + sufixo;
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
    const { name, value } = e.target;

    if (name === "produto") {
      const produtoSelecionado = produtos.find(
        (p) => p.id_produto == value
      );

      setItemAtual({
        ...itemAtual,
        produto: value,
        preco_unitario: produtoSelecionado?.preco || "",
      });
    } else {
      setItemAtual({ ...itemAtual, [name]: value });
    }
  }

  function adicionarItem() {
    if (
      !itemAtual.produto ||
      !itemAtual.quantidade_comprada ||
      !itemAtual.preco_unitario
    ) {
      setErro("Preencha todos os campos do item.");
      return;
    }

    if (Number(itemAtual.quantidade_comprada) <= 0) {
      setErro("Quantidade deve ser maior que 0.");
      return;
    }

    setItens([...itens, itemAtual]);
    setItemAtual(estadoInicialItem);
    setErro("");
  }

  function calcularTotal() {
    return itens.reduce(
      (acc, item) =>
        acc +
        Number(item.quantidade_comprada) *
          Number(item.preco_unitario),
      0
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (itens.length === 0) {
      setErro("Adicione pelo menos um item à compra.");
      return;
    }

    if (itens.some(item => Number(item.quantidade_comprada) <= 0)) {
      setErro("Existe item com quantidade inválida.");
      return;
    }

    try {
      const total = calcularTotal();

      const novaCompra = await criarDado("/compras/", {
        ...compra,
        id_compra: gerarIdCompra(),
        valor_total: total,
      });

      for (let item of itens) {
        await criarDado("/itens-compra/", {
          produto: item.produto,
          quantidade: Number(item.quantidade_comprada),
          valor_unitario: Number(item.preco_unitario),
          compra: novaCompra.id_compra,
        });
      }

      await criarDado("/despesas/", {
        id_despesa: gerarIdDespesa(),
        descricao: `Compra ${novaCompra.id_compra}`,
        valor: total.toFixed(2),
        data: compra.data_compra,
        categoria: "Compra",
        recorrente: false,
        funcionario: compra.funcionario,
        compra: novaCompra.id_compra,
      });

      setMensagem("Compra cadastrada com sucesso!");
      setErro("");
      setCompra(estadoInicialCompra);
      setItens([]);
    } catch (err) {
      console.log("ERRO BACKEND:", JSON.stringify(err.response?.data, null, 2));
      setErro("Erro ao cadastrar compra.");
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
          min="1"
          value={itemAtual.quantidade_comprada}
          onChange={handleChangeItem}
        />

        <FormInput
          label="Preço Unitário"
          name="preco_unitario"
          type="text"
          value={itemAtual.preco_unitario}
          readOnly
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