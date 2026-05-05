import pandas as pd
import os

os.system('cls')

df_produtos = pd.read_excel('mercadinho.xlsx', sheet_name= 'Produtos')

df_vendas = pd.read_excel('mercadinho.xlsx', sheet_name='Vendas')

# --------------------------------  Produtos --------------------------------------------
sim_values = ['sim', 's', '1', 'true']


def arruma(valor):
    if str(valor).strip().lower() in sim_values:
        return 'Sim'
    else :
        return 'Não'
    


df_produtos['Ativo'] = df_produtos['Ativo'].apply(arruma)

df_produtos['Preco_Venda'] = (
    df_produtos['Preco_Venda'].astype(str).str.replace('R$', '', regex=False).str.replace(',', '.').str.strip().astype(float)
)

df_produtos['Preco_Venda'] = df_produtos['Preco_Venda'].apply(lambda valor: f"R$ {valor:.2f}")
df_produtos['Preco_Custo'] = df_produtos['Preco_Custo'].apply(lambda x: f"R$ {x:.2f}")

un_value = ['un', 'unid', 'unidade', 'un.']
kg_value = ['kg', 'kilograma', 'kilo']

def normaliza_unidade(x):
    x = str(x).strip().lower()
    if x in un_value:
        return 'UN'
    elif x in kg_value:
        return 'KG'
    else:
        return x

df_produtos['Unidade'] = df_produtos['Unidade'].apply(normaliza_unidade)


def converte_data(x):
    formatos = ['%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y', '%d/%m/%Y', '%Y/%m/%d']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_produtos['Data_Ultima_Compra'] = df_produtos['Data_Ultima_Compra'].apply(converte_data)
df_produtos['Data_Ultima_Compra'] = df_produtos['Data_Ultima_Compra'].dt.strftime('%d/%m/%Y')

df_produtos = df_produtos.drop_duplicates(subset='ID_Produto', keep='first')
df_produtos = df_produtos.sort_values('ID_Produto')

categorias = {
    'bebidas': 'Bebidas',
    'hortifruti': 'Hortifruti',
    'hortifruti ': 'Hortifruti',
    'hortifruits': 'Hortifruti',
    'mercearia': 'Mercearia',
    'mercearia ': 'Mercearia',
    'padaria': 'Padaria',
    'padaria ': 'Padaria',
    'laticinios': 'Laticinios',
    'carnes': 'Carnes',
    'higiene': 'Higiene',
    'congelados': 'Congelados',
}

subcategorias = {
    'refrigerantes': 'Refrigerantes',
    'energeticos': 'Energeticos',
    'cervejas': 'Cervejas',
    'agua': 'Agua',
    'bolos': 'Bolos',
    'biscoitos': 'Biscoitos',
    'salgados': 'Salgados',
    'paes': 'Paes',
    'legumes': 'Legumes',
    'verduras': 'Verduras',
    'frutas': 'Frutas',
    'temperos': 'Temperos',
    'massas': 'Massas',
    'graos': 'Graos',
    'acucar_farinha': 'Acucar_Farinha',
    'iogurtes': 'Iogurtes',
    'leite': 'Leite',
    'queijos': 'Queijos',
    'bovina': 'Bovina',
    'suina': 'Suina',
    'aves': 'Aves',
    'embutidos': 'Embutidos',
    'limpeza': 'Limpeza',
    'descartaveis': 'Descartaveis',
    'pessoal': 'Pessoal',
    'sorvetes': 'Sorvetes',
    'polpas': 'Polpas',
    'prontos': 'Prontos',
}

def normaliza(valor, dicionario):
    chave = str(valor).strip().lower()
    return dicionario.get(chave, valor)

df_produtos['Categoria'] = df_produtos['Categoria'].apply(lambda x: normaliza(x, categorias))
df_produtos['Subcategoria'] = df_produtos['Subcategoria'].apply(lambda x: normaliza(x, subcategorias))

# --------------------------------  Vendas --------------------------------------------

pagamentos = {
    'pix': 'PIX',
    'Pix': 'PIX',
    'PIX': 'PIX',
    'cartao_debito': 'Cartao_Debito',
    'Cartão Débito': 'Cartao_Debito',
    'Debito': 'Cartao_Debito',
    'cartao_credito': 'Cartao_Credito',
    'Cartão Crédito': 'Cartao_Credito',
    'Credito': 'Cartao_Credito',
    'dinheiro': 'Dinheiro',
    'DINHEIRO': 'Dinheiro',
    'Espécie': 'Dinheiro',
    'Especie': 'Dinheiro',
    'fiado': 'Fiado',
    'FIADO': 'Fiado',
}

def arruma_pagamento(valor):
    if valor in pagamentos:
        return pagamentos[valor]
    else:
        return valor

df_vendas['Forma_Pagamento'] = df_vendas['Forma_Pagamento'].apply(arruma_pagamento)

def converte_data_venda(x):
    formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%m-%d-%y', '%m/%d/%y']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_vendas['Data_Venda'] = df_vendas['Data_Venda'].apply(converte_data_venda)
df_vendas['Data_Venda'] = df_vendas['Data_Venda'].dt.strftime('%d/%m/%Y')

def arruma_quantidade(x):
    if x < 0:
        return 0
    else:
        return x

df_vendas['Quantidade'] = df_vendas['Quantidade'].apply(arruma_quantidade)

def arruma_desconto(x):
    if x > 1:
        return x / 100
    else:
        return x

df_vendas['Desconto_Aplicado'] = df_vendas['Desconto_Aplicado'].apply(arruma_desconto)

#!Calculo subtotal (essa parte foi feita por IA, Sim... desisti de tentar essa parte)----------
def calcula_subtotal(linha):
    quantidade = linha['Quantidade']
    preco      = linha['Preco_Unitario']
    desconto   = linha['Desconto_Aplicado']
    total      = quantidade * preco * (1 - desconto)
    return round(total, 2)

df_vendas['Subtotal'] = df_vendas.apply(calcula_subtotal, axis=1)
#!------------------------------------------ 

def formata_desconto(x):
    return f"{x * 100:.0f}%"

def formata_dinheiro(x):
    return f"R$ {x:.2f}"

df_vendas['Desconto_Aplicado'] = df_vendas['Desconto_Aplicado'].apply(formata_desconto)
df_vendas['Preco_Unitario']    = df_vendas['Preco_Unitario'].apply(formata_dinheiro)
df_vendas['Subtotal']          = df_vendas['Subtotal'].apply(formata_dinheiro)


# --------------------------------  Fornecedores --------------------------------------------

df_fornecedores = pd.read_excel('mercadinho.xlsx', sheet_name="Fornecedores")

def formata_cnpj(x):
    x = str(x).strip().replace('.', '').replace('/', '').replace('-', '')
    if len(x) == 14:
        return f"{x[:2]}.{x[2:5]}.{x[5:8]}/{x[8:12]}-{x[12:]}"
    else:
        return x

df_fornecedores['CNPJ'] = df_fornecedores['CNPJ'].apply(formata_cnpj)

def arruma_email(x):
    x = str(x).strip()
    x = x.replace(' @ ', '@')
    return x

df_fornecedores['Email'] = df_fornecedores['Email'].apply(arruma_email)

estados = {
    'parana': 'PR', 
    'paraná': 'PR', 
    'pr': 'PR',

    'bahia': 'BA', 
    'ba': 'BA',

    'pernambuco': 'PE', 
    'pe': 'PE',

    'sao paulo': 'SP', 
    'são paulo': 'SP', 
    'sp': 'SP',

    'rio de janeiro': 'RJ', 
    'rj': 'RJ',

    'minas gerais': 'MG', 
    'mg': 'MG',

    'goias': 'GO', 
    'goiás': 'GO', 
    'go': 'GO',
}

def arruma_estado(x):
    chave = str(x).strip().lower()
    if chave in estados:
        return estados[chave]
    else:
        return x

df_fornecedores['Estado'] = df_fornecedores['Estado'].apply(arruma_estado)


def arruma_avaliacao(x):
    if x > 5:
        return 5.0
    else:
        return x

df_fornecedores['Avaliacao'] = df_fornecedores['Avaliacao'].apply(arruma_avaliacao)

# --------------------------------  Funcionarios --------------------------------------------

df_funcionarios = pd.read_excel('mercadinho.xlsx', sheet_name="Funcionarios")

def converte_data_admissao(x):
    formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_funcionarios['Data_Admissao'] = df_funcionarios['Data_Admissao'].apply(converte_data_admissao)
df_funcionarios['Data_Admissao'] = df_funcionarios['Data_Admissao'].dt.strftime('%d/%m/%Y')

def arruma_salario(x):
    x = str(x).strip().replace('R$', '').replace('.', '').replace(',', '.').strip()
    return f"R$ {float(x):.2f}"

df_funcionarios['Salario'] = df_funcionarios['Salario'].apply(arruma_salario)

turnos = {
    'integral': 'Integral',
    'manha': 'Manha',
    'tarde': 'Tarde',
    'madrugada': 'Madrugada',
}

def arruma_turno(x):
    chave = str(x).strip().lower()
    if chave in turnos:
        return turnos[chave]
    else:
        return x

df_funcionarios['Turno'] = df_funcionarios['Turno'].apply(arruma_turno)

ativo_values = ['ativo', 'a', 'active', 'sim', 's', '1', 'true']

def arruma_status(x):
    if str(x).strip().lower() in ativo_values:
        return 'Ativo'
    else:
        return None

df_funcionarios['Status'] = df_funcionarios['Status'].apply(arruma_status)

# --------------------------------  Clientes --------------------------------------------

df_clientes = pd.read_excel('mercadinho.xlsx', sheet_name="Clientes")

def arruma_nome(x):
    x = str(x).strip()
    return x.title()

df_clientes['Nome'] = df_clientes['Nome'].apply(arruma_nome)

def arruma_telefone(x):
    x = str(x).strip()
    x = x.replace('+55', '').replace('.', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
    if len(x) == 11:
        return f"({x[:2]}) {x[2:7]}-{x[7:]}"
    elif len(x) == 10:
        return f"({x[:2]}) {x[2:6]}-{x[6:]}"
    else:
        return x

df_clientes['Telefone'] = df_clientes['Telefone'].apply(arruma_telefone)

def converte_data_clientes(x):
    formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_clientes['Data_Cadastro'] = df_clientes['Data_Cadastro'].apply(converte_data_clientes)
df_clientes['Data_Cadastro'] = df_clientes['Data_Cadastro'].dt.strftime('%d/%m/%Y')

df_clientes['Ultima_Compra'] = df_clientes['Ultima_Compra'].apply(converte_data_clientes)
df_clientes['Ultima_Compra'] = df_clientes['Ultima_Compra'].dt.strftime('%d/%m/%Y')

def arruma_total_compras(x):
    if x < 0:
        return 0.0
    else:
        return x

df_clientes['Total_Compras'] = df_clientes['Total_Compras'].apply(arruma_total_compras)
df_clientes['Total_Compras'] = df_clientes['Total_Compras'].apply(lambda x: f"R$ {x:.2f}")

sim_fiado  = ['sim', 's', 'yes', '1', 'true']
nao_fiado  = ['nao', 'não', 'n', 'no', '0', 'false']

def arruma_fiado(x):
    chave = str(x).strip().lower()
    if chave in sim_fiado:
        return 'Sim'
    elif chave in nao_fiado:
        return 'Nao'
    else:
        return x

df_clientes['Possui_Fiado'] = df_clientes['Possui_Fiado'].apply(arruma_fiado)

df_clientes['Saldo_Fiado'] = df_clientes['Saldo_Fiado'].apply(lambda x: f"R$ {x:.2f}")

# --------------------------------  Despesas --------------------------------------------

df_despesas = pd.read_excel('mercadinho.xlsx', sheet_name="Despesas")

def converte_data_despesas(x):
    formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y', '%m.%d.%Y', '%m/%d/%Y']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_despesas['Data'] = df_despesas['Data'].apply(converte_data_despesas)
df_despesas['Data'] = df_despesas['Data'].dt.strftime('%d/%m/%Y')

categorias_despesas = {
    'folha_pagamento': 'Folha_Pagamento',
    'material_escritorio': 'Material_Escritorio',
    'aluguel': 'Aluguel',
    'energia': 'Energia',
    'agua': 'Agua',
    'internet': 'Internet',
    'telefone': 'Telefone',
    'manutencao': 'Manutencao',
    'marketing': 'Marketing',
    'diversos': 'Diversos',
    'transporte': 'Transporte',
}

def arruma_categoria_despesa(x):
    chave = str(x).strip().lower()
    if chave in categorias_despesas:
        return categorias_despesas[chave]
    else:
        return x

df_despesas['Categoria'] = df_despesas['Categoria'].apply(arruma_categoria_despesa)

def arruma_valor(x):
    x = str(x).strip().replace(',', '.')
    return f"R$ {float(x):.2f}"

df_despesas['Valor'] = df_despesas['Valor'].apply(arruma_valor)

sim_recorrente = ['sim', 's', '1', 'true']
nao_recorrente = ['nao', 'não', 'n', '0', 'false']

def arruma_recorrente(x):
    chave = str(x).strip().lower()
    if chave in sim_recorrente:
        return 'Sim'
    elif chave in nao_recorrente:
        return 'Nao'
    else:
        return x

df_despesas['Recorrente'] = df_despesas['Recorrente'].apply(arruma_recorrente)

# --------------------------------  Compras_Fornecedor --------------------------------------------

df_compras = pd.read_excel('mercadinho.xlsx', sheet_name="Compras_Fornecedor")

def converte_data_compras(x):
    formatos = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y', '%m.%d.%y']
    for fmt in formatos:
        try:
            return pd.to_datetime(x, format=fmt)
        except:
            continue
    return None

df_compras['Data_Compra']  = df_compras['Data_Compra'].apply(converte_data_compras)
df_compras['Data_Compra']  = df_compras['Data_Compra'].dt.strftime('%d/%m/%Y')

df_compras['Data_Entrega'] = df_compras['Data_Entrega'].apply(converte_data_compras)
df_compras['Data_Entrega'] = df_compras['Data_Entrega'].dt.strftime('%d/%m/%Y')

def arruma_data_vazia(x):
    if x is None:
        return 'Sem data'
    else:
        return x

df_compras['Data_Entrega'] = df_compras['Data_Entrega'].apply(arruma_data_vazia)

def arruma_nota_fiscal(x):
    if x is None:
        return 'Sem NF'
    else:
        return x

df_compras['Nota_Fiscal'] = df_compras['Nota_Fiscal'].apply(arruma_nota_fiscal)

df_compras['Preco_Unitario'] = df_compras['Preco_Unitario'].apply(lambda x: f"R$ {x:.2f}")
df_compras['Total']          = df_compras['Total'].apply(lambda x: f"R$ {x:.2f}")

with pd.ExcelWriter('Mercadinho_Arrumado.xlsx') as writer:
    df_produtos.to_excel(writer, index=False, sheet_name='Produtos')
    df_vendas.to_excel(writer, index=False, sheet_name='Vendas')
    df_fornecedores.to_excel(writer, index=False, sheet_name='Fornecedores')
    df_funcionarios.to_excel(writer, index=False, sheet_name='Funcionarios')
    df_clientes.to_excel(writer, index=False, sheet_name='Clientes')
    df_despesas.to_excel(writer, index=False, sheet_name='Despesas')
    df_compras.to_excel(writer, index=False, sheet_name='Compras_Fornecedor')