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

function EditarCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/compras") });

  useEffect(() => {
    api.get(`/compras/${id}/`).then((res) => setForm({ ...res.data, entregue: String(res.data.entregue) }));
    listarDados("/fornecedores/").then(setFornecedores);
    listarDados("/funcionarios/").then(setFuncionarios);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      await api.patch(`/compras/${id}/`, {
        nome: form.nome,
        fornecedor: form.fornecedor,
        funcionario: form.funcionario,
        data_compra: form.data_compra,
        status: form.status,
        entregue: form.entregue === "true",
        data_entrega: form.data_entrega || null,
        nota_fiscal: form.nota_fiscal,
        valor_total: form.valor_total,
      });
      invalidateCache();
      showToast("Compra atualizada com sucesso!", "success");
      setTimeout(() => navigate(`/compras?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar compra.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Compra</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormInput label="Nome da Compra" name="nome" value={form.nome || ""} onChange={handleChange} placeholder="Ex: Reposição de Laticínios" />
        <FormSelect label="Fornecedor" name="fornecedor" value={form.fornecedor} onChange={handleChange}
          options={fornecedores.map((f) => ({ value: f.id_fornecedor, label: f.nome_fantasia || f.razao_social }))}
        />
        <FormSelect label="Funcionário" name="funcionario" value={form.funcionario} onChange={handleChange}
          options={funcionarios.map((f) => ({ value: f.id_funcionario, label: `${f.nome} — ${f.cargo}` }))}
        />
        <FormInput label="Data da Compra" name="data_compra" type="date" value={form.data_compra} onChange={handleChange} required />
        <FormSelect label="Status" name="status" value={form.status} onChange={handleChange}
          options={[{ value: "Pendente", label: "Pendente" }, { value: "Entregue", label: "Entregue" }, { value: "Cancelada", label: "Cancelada" }]}
        />
        <FormSelect label="Entregue?" name="entregue" value={form.entregue} onChange={handleChange}
          options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]}
        />
        <FormInput label="Data de Entrega" name="data_entrega" type="date" value={form.data_entrega || ""} onChange={handleChange} />
        <FormInput label="Nota Fiscal" name="nota_fiscal" value={form.nota_fiscal || ""} onChange={handleChange} />
        <FormInput label="Valor Total (R$)" name="valor_total" type="number" step="0.01" value={form.valor_total} onChange={handleChange} required />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/compras")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarCompra;
