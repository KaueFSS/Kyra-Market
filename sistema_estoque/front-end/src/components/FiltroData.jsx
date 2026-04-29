function FiltroData({
  dataInicial,
  dataFinal,
  setDataInicial,
  setDataFinal,
  limparFiltro,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "end",
        marginTop: "20px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <label>Data inicial</label>
        <br />
        <input
          type="date"
          value={dataInicial}
          onChange={(event) => setDataInicial(event.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <div>
        <label>Data final</label>
        <br />
        <input
          type="date"
          value={dataFinal}
          onChange={(event) => setDataFinal(event.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <button
        type="button"
        onClick={limparFiltro}
        style={{
          padding: "9px 14px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Limpar filtro
      </button>
    </div>
  );
}

export default FiltroData;