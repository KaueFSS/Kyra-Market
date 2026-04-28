import { useEffect, useState } from "react";
import api from "../services/api";
import Paginacao from "../components/Paginacao";

function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/produtos/")
      .then((response) => {
        console.log("Resposta da API:", response.data);
        setErro("");

        if (Array.isArray(response.data)) {
          setProdutos(response.data);
        } else if (response.data.results) {
          setProdutos(response.data.results);
        } else {
          setProdutos([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        setErro("Não foi possível carregar os produtos.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Resumo diário do sistema</p>

      {erro && <p>{erro}</p>}

      <h2>Produtos</h2>

      {produtos.length === 0 && !erro ? (
        <p>Carregando ou nenhum produto encontrado...</p>
      ) : (
        <ul>
          {produtos.map((produto) => (
            <li key={produto.id_produto}>
              {produto.nome} - R$ {produto.preco}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DashboardMercadinho() {
  return (
    <div style={{ fontFamily: 'sans-serif' , fontSize: '32px'}}>
      
      <h2 style={{paddingBottom: '10px',paddingTop: '20px'}} >
      <h2>Visão geral do sistema</h2>
      </h2>
      
      {/* O iframe cria uma 'janela' no seu site que exibe o link do Metabase */}
      <iframe
        src="http://localhost:3000/public/dashboard/9e121adb-41a6-4aef-acfe-26dafdabceca"
        frameBorder="0" 
        width="100%"
        height="1000"
        allowTransparency="true"
      ></iframe>

    </div>
  );
}

export default DashboardMercadinho;