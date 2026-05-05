function FiltroData({ dataInicial, dataFinal, setDataInicial, setDataFinal, limparFiltro }) {
  return (
    <div className="filter-date" style={{ marginBottom: "16px" }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Data inicial</label>
        <input
          type="date"
          value={dataInicial}
          onChange={(e) => setDataInicial(e.target.value)}
          className="form-input"
          style={{ maxWidth: "180px" }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Data final</label>
        <input
          type="date"
          value={dataFinal}
          onChange={(e) => setDataFinal(e.target.value)}
          className="form-input"
          style={{ maxWidth: "180px" }}
        />
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={limparFiltro} style={{ alignSelf: "flex-end" }}>
        Limpar filtro
      </button>
    </div>
  );
}

export default FiltroData;
