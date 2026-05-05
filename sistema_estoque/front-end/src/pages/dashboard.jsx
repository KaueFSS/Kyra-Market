function DashboardMercadinho() {
  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Visão geral do sistema via Metabase</p>
        </div>
      </div>

      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
      }}>
        <iframe
          src="http://localhost:3000/public/dashboard/9e121adb-41a6-4aef-acfe-26dafdabceca"
          frameBorder="0"
          width="100%"
          height="900"
          allowTransparency="true"
          title="Dashboard Metabase"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}

export default DashboardMercadinho;
