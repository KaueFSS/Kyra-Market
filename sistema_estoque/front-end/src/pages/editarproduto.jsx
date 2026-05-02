import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { listarDados } from "../services/crudService";

function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/produtos/${id}/`).then((res) => setForm(res.data));
    listarDados("/fornecedores/").then(setFornecedores);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/produtos/${id}/`, form);
      setMensagem("Produto atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar produto.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Produto</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required />

        <FormSelect
          label="Fornecedor"
          name="fornecedor"
          value={form.fornecedor || ""}
          onChange={handleChange}
          options={fornecedores.map((f) => ({ value: f.id_fornecedor, label: f.nome_fantasia || f.razao_social }))}
        />

        <div style={{ marginBottom: "15px" }}>
          <label>Marca</label><br />
          <input
            list="lista-marcas-edit"
            name="marca"
            value={form.marca || ""}
            onChange={handleChange}
            placeholder="Digite ou selecione a marca"
            style={{ padding: "8px", width: "270px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
          />
          <datalist id="lista-marcas-edit">
            {fornecedores.map((f) => <option key={f.id_fornecedor} value={f.nome_fantasia || f.razao_social} />)}
          </datalist>
        </div>

        <FormInput label="Categoria" name="categoria" value={form.categoria || ""} onChange={handleChange} />
        <FormInput label="Subcategoria" name="subcategoria" value={form.subcategoria || ""} onChange={handleChange} />
        <FormInput label="Unidade" name="unidade" value={form.unidade || ""} onChange={handleChange} />
        <FormInput label="Código de Barras" name="codigo_barras" value={form.codigo_barras || ""} onChange={handleChange} />
        <FormInput label="Preço de Venda (R$)" name="preco" type="number" step="0.01" value={form.preco} onChange={handleChange} required />
        <FormInput label="Preço de Custo (R$)" name="preco_custo" type="number" step="0.01" value={form.preco_custo} onChange={handleChange} required />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/produtos")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarProduto;
