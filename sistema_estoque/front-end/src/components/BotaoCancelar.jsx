function BotaoCancelar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginLeft: "8px",
      }}
    >
      Cancelar
    </button>
  );
}

export default BotaoCancelar;