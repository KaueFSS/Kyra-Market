import { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormSelectSearch from "../components/FormSelectSearch";
import BotaoSalvar from "../components/BotaoSalvar";
import BotaoNavegacao from "../components/BotaoNavegacao";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { invalidateCache } from "../utils/apiCache";
import { formatarMoeda } from "../utils/formatadores";

function CadastrarVendas() {
  const [vendas, setVendas] = useState({
    nome: "",
    data_venda: new Date().toISOString().split("T")[0],
    hora: "",
    forma_pagamento: "",
    funcionario: "",
    cliente: "",
  });

  const [itemAtual, setItemAtual] = useState({
    produto: "",
    quantidade_vendida: "",
    desconto: "0",
  });

  const [itens, setItens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const prod = await listarDados("/produtos/");
        const cli = await listarDados("/clientes/");
        const func = await listarDados("/funcionarios/");

        setProdutos(prod.results || prod);
        setClientes(cli.results || cli);
        setFuncionarios(func.results || func);
      } catch (err) {
        console.error(err);
      }
    }

    carregarDados();
  }, []);

  function alterarCampoVenda(event) {
    const { name, value } = event.target;
    setVendas({ ...vendas, [name]: value });
  }

  function alterarCampoItem(event) {
    const { name, value } = event.target;
    setItemAtual({ ...itemAtual, [name]: value });
  }

  function arredondarMoeda(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
  }

  function adicionarItem() {
    const qtdNum = parseInt(itemAtual.quantidade_vendida, 10) || 0;
    const descNum = arredondarMoeda(itemAtual.desconto) || 0;

    const produtoSelecionado = produtos.find((p) => p.id_produto === itemAtual.produto);

    if (!itemAtual.produto) {
      setErro("Selecione um produto.");
      return;
    }

    if (!produtoSelecionado) {
      setErro("Produto inválido.");
      return;
    }

    if (qtdNum <= 0) {
      setErro("A quantidade deve ser maior que zero.");
      return;
    }

    const subtotalCalculado = qtdNum * arredondarMoeda(produtoSelecionado.preco) - descNum;

    if (subtotalCalculado < 0) {
      setErro("O desconto não pode ser maior que o valor total dos produtos.");
      return;
    }

    if (itens.some((item) => item.produto === itemAtual.produto)) {
      setErro("Este produto já foi adicionado nesta venda.");
      return;
    }

    setItens([
      ...itens,
      {
        ...itemAtual,
        quantidade_vendida: qtdNum,
        desconto: descNum,
        subtotal: subtotalCalculado,
      },
    ]);
    setErro("");
    setItemAtual({ produto: "", quantidade_vendida: "", desconto: "0" });
  }

  function removerItem(produtoId) {
    setItens((itensAtuais) => itensAtuais.filter((item) => item.produto !== produtoId));
    setErro("");
  }

  async function salvarVendas(event) {
    event.preventDefault();

    if (itens.length === 0) {
      setErro("Adicione pelo menos um item à venda.");
      return;
    }

    try {
      await criarDado("/registrar-venda/", {
        ...vendas,
        cliente: vendas.cliente || null,
        itens: itens.map((item) => {
          const produtoSelecionado = produtos.find((p) => p.id_produto === item.produto);
          return {
            produto: item.produto,
            quantidade_vendida: item.quantidade_vendida,
            preco_unitario: Number(produtoSelecionado?.preco || 0).toFixed(2),
            desconto_aplicado: Number(item.desconto).toFixed(2),
          };
        }),
      });

      invalidateCache();
      setMensagem("Venda cadastrada com sucesso!");
      setErro("");
      setVendas({
        nome: "",
        data_venda: new Date().toISOString().split("T")[0],
        hora: "",
        forma_pagamento: "",
        funcionario: "",
        cliente: "",
      });
      setItemAtual({ produto: "", quantidade_vendida: "", desconto: "0" });
      setItens([]);
    } catch (error) {
      console.error(error.response?.data);
      setErro(error.response?.data?.erro || "Erro ao cadastrar venda. Verifique os campos.");
      setMensagem("");
    }
  }

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  const opcoesClientes = clientes.map((c) => ({
    value: c.id_cliente,
    label: `${c.id_cliente} - ${c.nome}`,
  }));

  const opcoesProdutos = produtos.map((p) => ({
    value: p.id_produto,
    label: `${p.id_produto} - ${p.nome}`,
  }));

  const totalVenda = itens.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Venda</h1>
      <p className="page-subtitle">Preencha os dados da venda e adicione um ou mais itens.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={salvarVendas} className="form-container">
        <div className="form-section">
          <h3 className="form-section-title">Dados da Venda</h3>

          <FormInput
            label="Nome da Venda"
            name="nome"
            value={vendas.nome}
            onChange={alterarCampoVenda}
            placeholder="Ex: Venda Balcão - Manhã"
          />

          <FormInput
            label="Data da Venda"
            name="data_venda"
            type="date"
            value={vendas.data_venda}
            onChange={alterarCampoVenda}
            required={true}
          />

          <FormInput
            label="Hora"
            name="hora"
            type="time"
            value={vendas.hora}
            onChange={alterarCampoVenda}
            required={true}
          />

          <FormSelect
            label="Forma de Pagamento"
            name="forma_pagamento"
            value={vendas.forma_pagamento}
            onChange={alterarCampoVenda}
            options={[
              { value: "", label: "Selecione" },
              { value: "dinheiro", label: "Dinheiro" },
              { value: "pix", label: "PIX" },
              { value: "cartao_debito", label: "Cartão de Débito" },
              { value: "cartao_credito", label: "Cartão de Crédito" },
              { value: "fiado", label: "Fiado" },
            ]}
          />

          <FormSelectSearch
            label="Funcionário Responsável"
            name="funcionario"
            value={vendas.funcionario}
            onChange={alterarCampoVenda}
            options={opcoesFuncionarios}
            placeholder="Selecione um funcionário..."
            required={true}
          />

          <FormSelectSearch
            label="Cliente (opcional)"
            name="cliente"
            value={vendas.cliente}
            onChange={alterarCampoVenda}
            options={opcoesClientes}
            placeholder="Selecione um cliente..."
            isClearable={true}
          />

          <div style={{ marginTop: 8 }}>
            <BotaoNavegacao urlPagina="/clientes/novo" texto="+ Cadastrar novo cliente" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Adicionar Item à Venda</h3>

          <FormSelectSearch
            label="Produto"
            name="produto"
            value={itemAtual.produto}
            onChange={alterarCampoItem}
            options={opcoesProdutos}
            placeholder="Selecione um produto..."
          />

          <FormInput
            label="Quantidade Vendida"
            name="quantidade_vendida"
            type="number"
            value={itemAtual.quantidade_vendida}
            onChange={alterarCampoItem}
            placeholder="Ex: 2"
          />

          <FormInput
            label="Desconto (R$)"
            name="desconto"
            type="number"
            step="0.01"
            value={itemAtual.desconto}
            onChange={alterarCampoItem}
            placeholder="Ex: 0.00"
          />

          <div className="form-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-primary" onClick={adicionarItem}>
              + Adicionar Item
            </button>
          </div>
        </div>

        {itens.length > 0 && (
          <div className="form-section">
            <h3 className="form-section-title">Itens da Venda</h3>
            {itens.map((item, index) => {
              const produtoSelecionado = produtos.find((p) => p.id_produto === item.produto);
              return (
                <div className="item-card" key={index}>
                  <div className="item-card-header">
                    <p><strong>{produtoSelecionado ? produtoSelecionado.nome : item.produto}</strong></p>
                    <button
                      type="button"
                      className="item-remove-button"
                      onClick={() => removerItem(item.produto)}
                      aria-label="Remover produto da venda"
                      title="Remover produto"
                    >
                      Remover
                    </button>
                  </div>
                  <p>
                    {item.quantidade_vendida} un &nbsp;·&nbsp; Desconto: {formatarMoeda(item.desconto)} &nbsp;·&nbsp;
                    Subtotal: <strong style={{ color: "var(--accent-green)" }}>{formatarMoeda(item.subtotal)}</strong>
                  </p>
                </div>
              );
            })}
            <p style={{ color: "var(--accent-green)", fontWeight: 700, fontSize: "1.1rem", marginTop: 8 }}>
              Total: {formatarMoeda(totalVenda)}
            </p>
          </div>
        )}

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Venda" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarVendas;
