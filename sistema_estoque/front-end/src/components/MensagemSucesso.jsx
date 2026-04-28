function MensagemSucesso({ mensagem }) {
  if (!mensagem) {
    return null;
  }

  return (
    <p style={{ color: "lightgreen", fontWeight: "bold" }}>
      {mensagem}
    </p>
  );
}

export default MensagemSucesso;