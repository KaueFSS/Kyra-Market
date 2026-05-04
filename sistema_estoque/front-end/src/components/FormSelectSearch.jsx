import Select from "react-select";

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
  const estilosCustomizados = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#3b3b3b",
      borderColor: state.isFocused ? "#ffffff" : "#bfbfbf",
      boxShadow: "none",
      minHeight: "44px",
      height: "44px",
      borderRadius: "8px",
      color: "white",
      width: "100%",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "44px",
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    singleValue: (base) => ({
      ...base,
      color: "white",
    }),
    input: (base) => ({
      ...base,
      color: "white",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#ffffff",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#3b3b3b",
      color: "white",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#94b6ff" : "#3b3b3b",
      color: "white",
      cursor: "pointer",
    }),
  };

  //busca a opção que ja foi selecionada
  const opcaoSelecionada =
    options.find((option) => option.value === value) || null;

  //atribui sua opção ao valor 
  function handleSelectChange(opcaoSelecionada) {
    onChange({
      target: {
        name,
        value: opcaoSelecionada ? opcaoSelecionada.value : "",
      },
    });
  }

    return (
    <div
      style={{
        width: "100%",
        maxWidth: "340px",
        margin: "0 auto 20px auto",
        textAlign: "center",
        fontSize: 14,
      }}
    >
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: "white",
            fontSize: 18,
          }}
        >
          {label} {required && "*"}
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