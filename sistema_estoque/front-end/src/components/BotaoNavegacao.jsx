import { useNavigate } from "react-router-dom";

function BotaoNavegacao({ urlPagina, texto }) {
  const navigate = useNavigate();

  function irParaPagina(urlPagina) {
    navigate(urlPagina);
  }

  return (
    <button
      type="button"
      onClick={() => irParaPagina(urlPagina)}
      style={{
        padding: "10px 20px",
        width: "340px",
        backgroundColor: "#1f6feb",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "10px",
      }}
    >
      {texto}
    </button>
  );
}

export default BotaoNavegacao;