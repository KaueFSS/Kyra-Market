from django.core.validators import MinValueValidator
from django.db import models


class FormaPagamento(models.TextChoices):
    DINHEIRO       = "dinheiro",       "Dinheiro"
    PIX            = "pix",            "PIX"
    CARTAO_DEBITO  = "cartao_debito",  "Cartão Débito"
    CARTAO_CREDITO = "cartao_credito", "Cartão Crédito"
    FIADO          = "fiado",          "Fiado"


# FIX 1: removidas chaves duplicadas e o "PIX " com espaço
FORMAS_PAGAMENTO_ALIASES = {

    # Dinheiro
    "dinheiro": FormaPagamento.DINHEIRO,
    "Dinheiro": FormaPagamento.DINHEIRO,
    "DINHEIRO": FormaPagamento.DINHEIRO,
    "Especie":  FormaPagamento.DINHEIRO,
    "Espécie":  FormaPagamento.DINHEIRO,

    # PIX
    "pix": FormaPagamento.PIX,
    "PIX": FormaPagamento.PIX,
    "Pix": FormaPagamento.PIX,

    # Cartão Débito
    "cartao_debito": FormaPagamento.CARTAO_DEBITO,
    "Cartao_Debito": FormaPagamento.CARTAO_DEBITO,
    "Cartão Débito": FormaPagamento.CARTAO_DEBITO,

    # Cartão Crédito
    "cartao_credito": FormaPagamento.CARTAO_CREDITO,
    "Cartao_Credito": FormaPagamento.CARTAO_CREDITO,
    "Cartão Crédito": FormaPagamento.CARTAO_CREDITO,
    "Credito":        FormaPagamento.CARTAO_CREDITO,
    "Crédito":        FormaPagamento.CARTAO_CREDITO,

    # Fiado
    "fiado": FormaPagamento.FIADO,
    "Fiado": FormaPagamento.FIADO,
    "FIADO": FormaPagamento.FIADO,
}


class Fornecedor(models.Model):
    id_fornecedor = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID do fornecedor",
    )
    razao_social = models.CharField(
        max_length=150,
        verbose_name="Razao social",
    )
    nome_fantasia = models.CharField(
        max_length=150,
        default="",
        blank= True,
        verbose_name="Nome_Fantasia",
    )
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        verbose_name="CNPJ",
    )
    email = models.EmailField(
        blank=True,
        verbose_name="E-mail",
    )
    cidade = models.CharField(
        max_length=100,
        verbose_name="Cidade",
    )
    uf = models.CharField(
        max_length=2,
        verbose_name="UF",
    )
    telefone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Telefone",
    )
    prazo_de_entraga = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Prazo Entrega Dias",
    )
    avaliacao = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=0,                        
    validators=[MinValueValidator(0)],
    verbose_name="Avaliação",
    )

    class Meta:
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        ordering = ["razao_social"]

    def __str__(self):
        return f"{self.id_fornecedor} - {self.razao_social}"


class Funcionario(models.Model):
    id_funcionario = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID do funcionario",
    )
    nome = models.CharField(
        max_length=150,
        verbose_name="Nome",
    )
    cargo = models.CharField(
        max_length=100,
        verbose_name="Cargo",
    )
    data_admissao = models.DateField(
        verbose_name="Data de admissao",
    )
    turno = models.CharField(
        max_length=30,
        verbose_name="Turno",
    )
    salario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default= 0,
        validators=[MinValueValidator(0)],
        verbose_name="Salario",
    )
    horas_semanais = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Horas semanais",
    )
    ativo = models.BooleanField(
        verbose_name= "Ativo",
        default= False,
    )

    class Meta:
        verbose_name = "Funcionario"
        verbose_name_plural = "Funcionarios"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.id_funcionario} - {self.nome}"


class Cliente(models.Model):
    id_cliente = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID do cliente",
    )
    nome = models.CharField(
        max_length=150,
        verbose_name="Nome",
    )
    telefone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Telefone",
    )
    possui_fiado = models.BooleanField(
        default=False,
        verbose_name="Possui fiado",
    )
    saldo_fiado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Saldo fiado",
    )
    data_cadastro = models.DateField(
        verbose_name="Data de cadastro",
    )
    total_valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Total em compras",
    )
    bairro = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Bairro",
    )
    ultima_compra = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ultima compra",
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.id_cliente} - {self.nome}"


class Produto(models.Model):
    id_produto = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID do produto",
    )
    fornecedor = models.ForeignKey(
        "Fornecedor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="produtos",
        db_column="id_fornecedor",
        verbose_name="Fornecedor",
    )
    nome = models.CharField(
        max_length=150,
        verbose_name="Nome",
    )
    categoria = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Categoria",
    )
    subcategoria = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Sub-Categoria",
    )
    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Marca",
    )
    unidade = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Unidade",
    )
    codigo_barras = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Codigo de barras",
    )
    preco_custo = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=0,                        
    validators=[MinValueValidator(0)],
    verbose_name="Preco Custo",
)
    preco = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Preco",
    )

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.id_produto} - {self.nome}"


class Venda(models.Model):
    id_venda = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID da venda",
    )
    nome = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Nome da venda",
    )
    data_venda = models.DateField(
        verbose_name="Data da venda",
    )
    hora = models.TimeField(
        verbose_name="Hora da venda",
    )
    forma_pagamento = models.CharField(
        max_length=20,
        choices=FormaPagamento.choices,
        verbose_name="Forma de pagamento",
    )
    produtos = models.ManyToManyField(
        Produto,
        through="ItemVenda",
        related_name="vendas",
        verbose_name="Produtos",
    )
    funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        related_name="vendas",
        db_column="id_funcionario",
        verbose_name="Funcionario",
    )
    cliente = models.ForeignKey(
    Cliente,
    on_delete=models.PROTECT,
    null=True,       # ← adicionar
    blank=True,      # ← adicionar
    related_name="vendas",
    db_column="id_cliente",
    verbose_name="Cliente",
)

    class Meta:
        verbose_name = "Venda"
        verbose_name_plural = "Vendas"
        ordering = ["-data_venda", "-hora"]

    def __str__(self):
        return f"Venda {self.id_venda}"


class ItemVenda(models.Model):
    id_item_venda = models.AutoField(primary_key=True)
    venda = models.ForeignKey(
        Venda,
        on_delete=models.CASCADE,
        related_name="itens",
        db_column="id_venda",
        verbose_name="Venda",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name="itens_venda",
        db_column="id_produto",
        verbose_name="Produto",
    )
    quantidade_vendida = models.PositiveIntegerField(
        verbose_name="Quantidade vendida",
    )
    preco_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Preco unitario",
    )
    desconto_aplicado = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Desconto aplicado",
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Subtotal",
    )

    class Meta:
        verbose_name = "Item da venda"
        verbose_name_plural = "Itens da venda"
        ordering = ["venda_id", "produto_id"]

    def __str__(self):
        return f"{self.venda_id} - {self.produto.nome} x{self.quantidade_vendida}"


# FIX 2: CompraFornecedor agora é o cabeçalho da nota fiscal (sem produto/quantidade diretamente)
class CompraFornecedor(models.Model):
    id_compra = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID da compra",
    )
    nome = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Nome da compra",
    )
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.PROTECT,
        related_name="compras",
        db_column="id_fornecedor",
        verbose_name="Fornecedor",
    )
    funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        related_name="compras_registradas",
        db_column="id_funcionario",
        verbose_name="Funcionario responsavel",
    )
    produtos = models.ManyToManyField(
        Produto,
        through="ItemCompra",
        related_name="compras_fornecedor",
        verbose_name="Produtos",
    )
    data_compra = models.DateField(
        verbose_name="Data da compra",
    )
    status = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Status",
    )
    data_entrega = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data de entrega",
    )
    entregue = models.BooleanField(
        verbose_name= "Entregue",
        default= False,
    )
    nota_fiscal = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Nota fiscal",
    )
    valor_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Valor total",
    )

    class Meta:
        verbose_name = "Compra de fornecedor"
        verbose_name_plural = "Compras de fornecedor"
        ordering = ["-data_compra"]

    def __str__(self):
        return f"Compra {self.id_compra} - {self.fornecedor.razao_social}"


# FIX 2 (cont.): novo modelo ItemCompra, análogo ao ItemVenda
class ItemCompra(models.Model):
    id_item_compra = models.AutoField(primary_key=True)
    compra = models.ForeignKey(
        CompraFornecedor,
        on_delete=models.CASCADE,
        related_name="itens",
        db_column="id_compra",
        verbose_name="Compra",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name="itens_compra",
        db_column="id_produto",
        verbose_name="Produto",
    )
    quantidade = models.PositiveIntegerField(
        verbose_name="Quantidade",
    )
    valor_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Valor unitario",
    )
    class Meta:
        verbose_name = "Item da compra"
        verbose_name_plural = "Itens da compra"
        ordering = ["compra_id", "produto_id"]

    def __str__(self):
        return f"{self.compra_id} - {self.produto.nome} x{self.quantidade}"


class Despesa(models.Model):
    id_despesa = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID da despesa",
    )
    funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        related_name="despesas",
        db_column="id_funcionario",
        verbose_name="Funcionario",
    )
    compra = models.ForeignKey(
        CompraFornecedor,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="despesas",
        db_column="id_compra",
        verbose_name="Compra vinculada",
    )
    data = models.DateField(
        verbose_name="Data",
    )
    categoria = models.CharField(
        max_length=100,
        verbose_name="Categoria",
    )
    descricao = models.CharField(
    max_length=100,
    blank=True,
    verbose_name="Descrição",
)
    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Valor",
    )
    recorrente = models.BooleanField(
        verbose_name= "Recorrente",
        default= False,
    )

    class Meta:
        verbose_name = "Despesa"
        verbose_name_plural = "Despesas"
        ordering = ["-data"]

    def __str__(self):
        return f"Despesa {self.id_despesa} - {self.categoria}"


# FIX 3: OneToOneField garante um único registro de estoque por produto
class Estoque(models.Model):
    id_estoque = models.CharField(
        max_length=10,
        primary_key=True,
        verbose_name="ID do estoque",
    )
    produto = models.OneToOneField(
        Produto,
        on_delete=models.PROTECT,
        related_name="estoque",
        db_column="id_produto",
        verbose_name="Produto",
    )
    quantidade_atual = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        verbose_name="Quantidade atual",
    )
    quantidade_minima = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        verbose_name="Estoque mínimo",
    )
    dt_ultima_saida = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data da última saída",
    )
    dt_ultima_entrada = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data da última entrada",
    )


    class Meta:
        verbose_name = "Estoque"
        verbose_name_plural = "Estoques"
        ordering = ["id_estoque"]

    def __str__(self):
        return f"Estoque {self.id_estoque} - {self.produto.nome}"
