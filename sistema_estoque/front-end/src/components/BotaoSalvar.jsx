function BotaoSalvar({ texto = "Salvar" }) {
  return (
    <button
      type="submit"
      style={{
        padding: "10px 20px",
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

export default BotaoSalvar;