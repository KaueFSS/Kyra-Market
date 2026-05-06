function SearchBarPage({
  label = "Pesquisar",
  value,
  onChange,
  placeholder = "Digite para pesquisar...",
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {label}
        </label>
      )}

      <input
        type="text"
        className="searchbar-page-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          maxWidth: "550px",
          padding: "12px 14px",
          borderRadius: "8px",
          border: "1px solid #455168",
          backgroundColor: "#1a1d2e",
          color: "#ffffff",
          outline: "none",
          fontSize: "1rem",
          placeholder: "#8b8fa8",
        }}
      />
    </div>
  );
}

export default SearchBarPage;