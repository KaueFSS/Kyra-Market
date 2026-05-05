import { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

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
      const produtoSelecionado = produtos.find((produto) => produto.id_produto === value);

      setItemAtual({
        ...itemAtual,
        produto: value,
        preco_unitario: produtoSelecionado?.preco || "",
      });
      return;
    }

    setItemAtual({ ...itemAtual, [name]: value });
  }

  function adicionarItem() {
    if (!itemAtual.produto || !itemAtual.quantidade_comprada || !itemAtual.preco_unitario) {
      setErro("Preencha todos os campos do item.");
      return;
    }

    if (Number(itemAtual.quantidade_comprada) <= 0) {
      setErro("Quantidade deve ser maior que 0.");
      return;
    }

    const itemJaAdicionado = itens.some((item) => item.produto === itemAtual.produto);

    if (itemJaAdicionado) {
      setErro("Este produto ja foi adicionado nesta compra.");
      return;
    }

    setItens([...itens, itemAtual]);
    setItemAtual(estadoInicialItem);
    setErro("");
  }

  function calcularTotal() {
    return itens.reduce(
      (acc, item) => acc + Number(item.quantidade_comprada) * Number(item.preco_unitario),
      0
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (itens.length === 0) {
      setErro("Adicione pelo menos um item a compra.");
      return;
    }

    if (itens.some((item) => Number(item.quantidade_comprada) <= 0)) {
      setErro("Existe item com quantidade invalida.");
      return;
    }

    try {
      const entregue = compra.status === "Entregue";

      await criarDado("/registrar-compra/", {
        nome: compra.nome,
        fornecedor: compra.fornecedor,
        funcionario: compra.funcionario,
        data_compra: compra.data_compra,
        status: compra.status,
        entregue,
        data_entrega: compra.data_entrega || null,
        valor_total: calcularTotal().toFixed(2),
        itens: itens.map((item) => ({
          produto: item.produto,
          quantidade: Number(item.quantidade_comprada),
          valor_unitario: Number(item.preco_unitario).toFixed(2),
        })),
      });

      setMensagem("Compra cadastrada com sucesso!");
      setErro("");
      setCompra(estadoInicialCompra);
      setItemAtual(estadoInicialItem);
      setItens([]);
    } catch (err) {
      console.log("ERRO BACKEND:", JSON.stringify(err.response?.data, null, 2));
      setErro(err.response?.data?.erro || "Erro ao cadastrar compra.");
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
          options={fornecedores.map((fornecedor) => ({
            value: fornecedor.id_fornecedor,
            label: fornecedor.nome_fantasia || fornecedor.razao_social,
          }))}
        />

        <FormSelect
          label="Funcionario"
          name="funcionario"
          value={compra.funcionario}
          onChange={handleChangeCompra}
          options={funcionarios.map((funcionario) => ({
            value: funcionario.id_funcionario,
            label: funcionario.nome,
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
          options={produtos.map((produto) => ({
            value: produto.id_produto,
            label: produto.nome,
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
          label="Preco Unitario"
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
          {itens.map((item, index) => {
            const produtoSelecionado = produtos.find(
              (produto) => produto.id_produto === item.produto
            );

            return (
              <li key={index}>
                {produtoSelecionado?.nome || item.produto} - {item.quantidade_comprada} x {item.preco_unitario}
              </li>
            );
          })}
        </ul>

        <h3>Total: R$ {calcularTotal().toFixed(2)}</h3>

        <BotaoSalvar texto="Cadastrar Compra" />
      </form>
    </div>
  );
}

export default CadastrarCompra;
