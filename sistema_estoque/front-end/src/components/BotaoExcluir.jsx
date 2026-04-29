function BotaoExcluir({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        backgroundColor: "#d9534f",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Excluir
    </button>
  );
}

export default BotaoExcluir;