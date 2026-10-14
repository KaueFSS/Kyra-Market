import Select from "react-select";

const estilosCustomizados = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#1f7a4d" : "#cbd1d9",
    borderWidth: "1px",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(31,122,77,0.15)" : "none",
    minHeight: "38px",
    borderRadius: "6px",
    color: "#18202c",
    width: "100%",
    fontSize: "0.92rem",
    transition: "border-color 0.12s, box-shadow 0.12s",
    "&:hover": { borderColor: state.isFocused ? "#1f7a4d" : "#aeb6c2" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  singleValue: (base) => ({ ...base, color: "#18202c" }),
  input: (base) => ({ ...base, color: "#18202c", margin: 0, padding: 0 }),
  placeholder: (base) => ({ ...base, color: "#98a1ae" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e5ea",
    boxShadow: "0 8px 24px rgba(16,24,40,0.12)",
    borderRadius: "8px",
    overflow: "hidden",
    marginTop: 4,
    zIndex: 9999,
  }),
  menuList: (base) => ({ ...base, padding: "4px 0" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#eef7f1" : state.isFocused ? "#f3f5f8" : "#ffffff",
    color: state.isSelected ? "#17603c" : "#18202c",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: state.isSelected ? 600 : 400,
    padding: "8px 12px",
    "&:active": { backgroundColor: "#e6efe9" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#98a1ae",
    padding: "0 6px",
    cursor: "pointer",
    "&:hover": { color: "#b42318" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#6b7280",
    padding: "0 8px",
    "&:hover": { color: "#18202c" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "#6b7280",
    fontSize: "0.88rem",
    padding: "12px",
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
          {label} {required && <span className="form-required">*</span>}
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
