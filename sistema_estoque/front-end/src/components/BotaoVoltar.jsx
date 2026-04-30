import { useNavigate } from "react-router-dom";

function BotaoVoltar({ texto = "Voltar" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      style={{
        padding: "8px 14px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        marginBottom: "20px",
      }}
    >
      {texto}
    </button>
  );
}

export default BotaoVoltar;