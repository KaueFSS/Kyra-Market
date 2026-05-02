import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

function EditarFuncionario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/funcionarios/${id}/`).then((res) => setForm({ ...res.data, ativo: String(res.data.ativo) }));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/funcionarios/${id}/`, { ...form, ativo: form.ativo === "true" });
      setMensagem("Funcionário atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar funcionário.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Funcionário</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required />
        <FormInput label="Cargo" name="cargo" value={form.cargo} onChange={handleChange} required />
        <FormInput label="Data de Admissão" name="data_admissao" type="date" value={form.data_admissao} onChange={handleChange} required />
        <FormSelect label="Turno" name="turno" value={form.turno} onChange={handleChange}
          options={[{ value: "Manhã", label: "Manhã" }, { value: "Tarde", label: "Tarde" }, { value: "Noite", label: "Noite" }]}
        />
        <FormInput label="Salário (R$)" name="salario" type="number" value={form.salario} onChange={handleChange} required />
        <FormInput label="Horas Semanais" name="horas_semanais" type="number" value={form.horas_semanais} onChange={handleChange} required />
        <FormSelect label="Ativo?" name="ativo" value={form.ativo} onChange={handleChange}
          options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/funcionarios")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarFuncionario;
