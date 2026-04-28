function MensagemErro({ mensagem }) {
  if (!mensagem) {
    return null;
  }

  return (
    <p style={{ color: "red", fontWeight: "bold" }}>
      {mensagem}
    </p>
  );
}

export default MensagemErro;