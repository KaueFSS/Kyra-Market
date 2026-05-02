import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

function EditarFornecedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/fornecedores/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/fornecedores/${id}/`, form);
      setMensagem("Fornecedor atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar fornecedor.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Fornecedor</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Razão Social" name="razao_social" value={form.razao_social} onChange={handleChange} required />
        <FormInput label="Nome Fantasia" name="nome_fantasia" value={form.nome_fantasia || ""} onChange={handleChange} />
        <FormInput label="CNPJ" name="cnpj" value={form.cnpj} onChange={handleChange} required />
        <FormInput label="Telefone" name="telefone" value={form.telefone || ""} onChange={handleChange} />
        <FormInput label="Email" name="email" type="email" value={form.email || ""} onChange={handleChange} />
        <FormInput label="Cidade" name="cidade" value={form.cidade || ""} onChange={handleChange} />
        <FormInput label="UF" name="uf" value={form.uf || ""} onChange={handleChange} />
        <FormInput label="Prazo de Entrega (dias)" name="prazo_de_entraga" type="number" value={form.prazo_de_entraga || ""} onChange={handleChange} />
        <FormSelect
          label="Avaliação"
          name="avaliacao"
          value={String(form.avaliacao)}
          onChange={handleChange}
          options={[
            { value: "1", label: "1 - Ruim" },
            { value: "2", label: "2 - Regular" },
            { value: "3", label: "3 - Bom" },
            { value: "4", label: "4 - Muito Bom" },
            { value: "5", label: "5 - Excelente" },
          ]}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/fornecedores")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarFornecedor;
