import { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormSelectSearch from "../components/FormSelectSearch";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { invalidateCache } from "../utils/apiCache";
import { formatarMoeda } from "../utils/formatadores";

const estadoInicialCompra = {
  nome: "", fornecedor: "", funcionario: "",
  data_compra: new Date().toISOString().split("T")[0],
  status: "Pendente", data_entrega: "",
};

const estadoInicialItem = { produto: "", quantidade_comprada: "", preco_unitario: "" };

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
      const [forn, func, prod] = await Promise.all([
        listarDados("/fornecedores/"), listarDados("/funcionarios/"), listarDados("/produtos/"),
      ]);
      setFornecedores(forn.results || forn);
      setFuncionarios(func.results || func);
      setProdutos(prod.results || prod);
    }
    carregarDados();
  }, []);

  function handleChangeCompra(e) {
    setCompra({ ...compra, [e.target.name]: e.target.value });
  }

  function handleChangeItem(e) {
    const { name, value } = e.target;
    if (name === "produto") {
      const p = produtos.find((p) => p.id_produto === value);
      setItemAtual({ ...itemAtual, produto: value, preco_unitario: p?.preco_custo ?? "" });
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
    if (itens.some((i) => i.produto === itemAtual.produto)) {
      setErro("Este produto já foi adicionado nesta compra.");
      return;
    }
    setItens([...itens, itemAtual]);
    setItemAtual(estadoInicialItem);
    setErro("");
  }

  function removerItem(produtoId) {
    setItens((itensAtuais) => itensAtuais.filter((item) => item.produto !== produtoId));
    setErro("");
  }

  function calcularTotal() {
    return itens.reduce((acc, i) => acc + Number(i.quantidade_comprada) * Number(i.preco_unitario), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (itens.length === 0) {
      setErro("Adicione pelo menos um item à compra.");
      return;
    }
    try {
      const entregue = compra.status === "Entregue";
      await criarDado("/registrar-compra/", {
        nome: compra.nome, fornecedor: compra.fornecedor, funcionario: compra.funcionario,
        data_compra: compra.data_compra, status: compra.status, entregue,
        data_entrega: compra.data_entrega || null,
        valor_total: calcularTotal().toFixed(2),
        itens: itens.map((i) => ({
          produto: i.produto,
          quantidade: Number(i.quantidade_comprada),
          valor_unitario: Number(i.preco_unitario).toFixed(2),
        })),
      });
      invalidateCache();
      setMensagem("Compra cadastrada com sucesso!");
      setErro("");
      setCompra(estadoInicialCompra);
      setItemAtual(estadoInicialItem);
      setItens([]);
    } catch (err) {
      setErro(err.response?.data?.erro || "Erro ao cadastrar compra.");
      setMensagem("");
    }
  }

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  const opcoesFornecedores = fornecedores.map((f) => ({
    value: f.id_fornecedor,
    label: `${f.fornecedor} - ${f.nome_fantasia}`,
  }));

  const opcoesProdutos = produtos.map((p) => ({
    value: p.id_produto,
    label: `${p.id_produto} - ${p.nome}`,
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Compra</h1>
      <p className="page-subtitle">Preencha os dados da compra e adicione itens.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h3 className="form-section-title">Dados da Compra</h3>
          <FormInput label="Nome" name="nome" value={compra.nome} onChange={handleChangeCompra} placeholder="Ex: Reposição de Laticínios - Maio" />
          <FormSelectSearch
            label="Fornecedor"
            name="fornecedor"
            value={compra.fornecedor}
            onChange={handleChangeCompra}
            options={opcoesFornecedores}
            placeholder="Selecione um fornecedor..."
            required={true}
          />
          <FormSelectSearch
            label="Funcionário Responsável"
            name="funcionario"
            value={compra.funcionario}
            onChange={handleChangeCompra}
            options={opcoesFuncionarios}
            placeholder="Selecione um funcionário..."
            required={true}
          />
          <FormInput label="Data da Compra" name="data_compra" type="date" value={compra.data_compra} onChange={handleChangeCompra} />
          <FormSelect label="Status" name="status" value={compra.status} onChange={handleChangeCompra}
            options={[{ value: "Pendente", label: "Pendente" }, { value: "Entregue", label: "Entregue" }]}
          />
          <FormInput label="Data de Entrega" name="data_entrega" type="date" value={compra.data_entrega} onChange={handleChangeCompra} />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Adicionar Item</h3>
          <FormSelectSearch
            label="Produto"
            name="produto"
            value={itemAtual.produto}
            onChange={handleChangeItem}
            options={opcoesProdutos}
            placeholder="Selecione um produto..."
            required={true}
          />
          <FormInput label="Quantidade" name="quantidade_comprada" type="number" value={itemAtual.quantidade_comprada} onChange={handleChangeItem} />
          <div className="form-group">
            <label className="form-label">Preço de Custo Unitário (R$)</label>
            <div style={{ padding: "9px 12px", background: "var(--bg-input)", borderRadius: "var(--radius-input)", border: "1px solid var(--border-input)", color: "var(--text-secondary)", maxWidth: 400 }}>
              {itemAtual.preco_unitario ? formatarMoeda(itemAtual.preco_unitario) : "Selecione um produto"}
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-primary" onClick={adicionarItem}>+ Adicionar Item</button>
          </div>
        </div>

        {itens.length > 0 && (
          <div className="form-section">
            <h3 className="form-section-title">Itens adicionados</h3>
            {itens.map((item, index) => {
              const p = produtos.find((p) => p.id_produto === item.produto);
              return (
                <div className="item-card" key={index}>
                  <div className="item-card-header">
                    <p><strong>{p?.nome || item.produto}</strong></p>
                    <button
                      type="button"
                      className="item-remove-button"
                      onClick={() => removerItem(item.produto)}
                      aria-label="Remover produto da compra"
                      title="Remover produto"
                    >
                      Remover
                    </button>
                  </div>
                  <p>{item.quantidade_comprada} x {formatarMoeda(item.preco_unitario)} = <strong style={{ color: "var(--accent-green)" }}>{formatarMoeda(Number(item.quantidade_comprada) * Number(item.preco_unitario))}</strong></p>
                </div>
              );
            })}
            <p style={{ color: "var(--accent-green)", fontWeight: 700, fontSize: "1.1rem", marginTop: 8 }}>
              Total: {formatarMoeda(calcularTotal())}
            </p>
          </div>
        )}

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Compra" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarCompra;
