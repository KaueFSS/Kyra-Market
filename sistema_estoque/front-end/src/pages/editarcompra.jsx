import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { listarDados } from "../services/crudService";

function EditarCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/compras/${id}/`).then((res) => setForm({ ...res.data, entregue: String(res.data.entregue) }));
    listarDados("/fornecedores/").then(setFornecedores);
    listarDados("/funcionarios/").then(setFuncionarios);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      setMensagem("Compra atualizada com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar compra.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Compra</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
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

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/compras")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarCompra;
