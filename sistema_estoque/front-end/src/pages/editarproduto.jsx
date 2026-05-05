import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { listarDados } from "../services/crudService";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/produtos") });

  useEffect(() => {
    api.get(`/produtos/${id}/`).then((res) => setForm(res.data));
    listarDados("/fornecedores/").then(setFornecedores);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      await api.patch(`/produtos/${id}/`, form);
      invalidateCache("/produtos/?page=1");
      showToast("Produto atualizado com sucesso!", "success");
      setTimeout(() => navigate(`/produtos?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar produto.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Produto</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required />
        <FormSelect label="Fornecedor" name="fornecedor" value={form.fornecedor || ""} onChange={handleChange}
          options={[{ value: "", label: "Sem fornecedor" }, ...fornecedores.map((f) => ({ value: f.id_fornecedor, label: f.nome_fantasia || f.razao_social }))]}
        />
        <FormInput label="Marca" name="marca" value={form.marca || ""} onChange={handleChange} placeholder="Ex: Nestlé, Unilever" />
        <FormInput label="Categoria" name="categoria" value={form.categoria || ""} onChange={handleChange} />
        <FormInput label="Subcategoria" name="subcategoria" value={form.subcategoria || ""} onChange={handleChange} />
        <FormInput label="Unidade" name="unidade" value={form.unidade || ""} onChange={handleChange} />
        <FormInput label="Código de Barras" name="codigo_barras" value={form.codigo_barras || ""} onChange={handleChange} />
        <FormInput label="Preço de Venda (R$)" name="preco" type="number" step="0.01" value={form.preco} onChange={handleChange} required />
        <FormInput label="Preço de Custo (R$)" name="preco_custo" type="number" step="0.01" value={form.preco_custo} onChange={handleChange} required />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/produtos")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarProduto;
