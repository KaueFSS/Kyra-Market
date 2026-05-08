import Select from "react-select";

const estilosCustomizados = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#2563eb" : "#c4cdd8",
    borderWidth: "1.5px",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(37,99,235,0.12)" : "0 1px 2px rgba(15,30,61,0.05)",
    minHeight: "46px",
    borderRadius: "9px",
    color: "#0f172a",
    width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
    "&:hover": { borderColor: state.isFocused ? "#2563eb" : "#94a3b8" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 13px" }),
  singleValue: (base) => ({ ...base, color: "#0f172a", fontWeight: 500 }),
  input: (base) => ({ ...base, color: "#0f172a" }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#ffffff",
    border: "1.5px solid #dde3ee",
    boxShadow: "0 12px 32px rgba(15,30,61,0.15)",
    borderRadius: "10px",
    overflow: "hidden",
    zIndex: 9999,
  }),
  menuList: (base) => ({ ...base, padding: "4px 0" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
      ? "#eff6ff"
      : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
    cursor: "pointer",
    fontSize: "0.92rem",
    fontWeight: state.isSelected ? 600 : 500,
    padding: "10px 14px",
    transition: "background 0.1s",
    "&:active": { backgroundColor: state.isSelected ? "#1d4ed8" : "#dbeafe" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#94a3b8",
    cursor: "pointer",
    "&:hover": { color: "#dc2626" },
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#2563eb" : "#94a3b8",
    "&:hover": { color: "#2563eb" },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "#dde3ee" }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "#475569",
    fontSize: "0.88rem",
    padding: "14px",
  }),
};

function FormSelectSearch({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  isClearable = false,
  required = false,
}) {
  const opcaoSelecionada = options.find((option) => option.value === value) || null;

  function handleSelectChange(opcaoSelecionada) {
    onChange({
      target: {
        name,
        value: opcaoSelecionada ? opcaoSelecionada.value : "",
      },
    });
  }

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: "var(--accent-red)" }}>*</span>}
        </label>
      )}
      <Select
        options={options}
        value={opcaoSelecionada}
        onChange={handleSelectChange}
        placeholder={placeholder}
        isSearchable
        isClearable={isClearable}
        styles={estilosCustomizados}
        noOptionsMessage={() => "Nenhuma opção encontrada"}
      />
    </div>
  );
}

export default FormSelectSearch;
