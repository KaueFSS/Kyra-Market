function BotaoEditar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        backgroundColor: "#f0ad4e",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginRight: "8px",
      }}
    >
      Editar
    </button>
  );
}

export default BotaoEditar;