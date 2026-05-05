import Select from "react-select";

const estilosCustomizados = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--bg-input, #1a1d2e)",
    borderColor: state.isFocused ? "#3b82f6" : "rgba(255,255,255,0.12)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.15)" : "none",
    minHeight: "40px",
    borderRadius: "8px",
    color: "white",
    width: "100%",
    maxWidth: "400px",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 12px",
  }),
  singleValue: (base) => ({ ...base, color: "white" }),
  input: (base) => ({ ...base, color: "white" }),
  placeholder: (base) => ({ ...base, color: "#8b8fa8" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#1a1d2e",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#252840" : "#1a1d2e",
    color: state.isFocused ? "white" : "#8b8fa8",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
  clearIndicator: (base) => ({ ...base, color: "#8b8fa8", cursor: "pointer" }),
  dropdownIndicator: (base) => ({ ...base, color: "#8b8fa8" }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "rgba(255,255,255,0.1)" }),
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
      />
    </div>
  );
}

export default FormSelectSearch;
