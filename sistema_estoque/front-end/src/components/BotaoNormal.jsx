function BotaoNormal({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
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

export default BotaoNormal;