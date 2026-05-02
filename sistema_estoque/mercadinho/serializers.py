from rest_framework import serializers
from .models import Produto, Estoque, Fornecedor, Funcionario, CompraFornecedor, ItemCompra, Despesa, ItemVenda, Venda, Cliente

class ProdutoSerializer(serializers.ModelSerializer):
    fornecedor_nome = serializers.CharField(source='fornecedor.nome_fantasia', read_only=True, default=None)

    class Meta:
        model = Produto
        fields = '__all__'


class EstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)

    class Meta:
        model = Estoque
        fields = '__all__'


class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = '__all__'


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = '__all__'


class ItemCompraSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)

    class Meta:
        model = ItemCompra
        fields = '__all__'


class CompraFornecedorSerializer(serializers.ModelSerializer):
    fornecedor_nome = serializers.CharField(source='fornecedor.razao_social', read_only=True)
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    itens = ItemCompraSerializer(many=True, read_only=True)

    class Meta:
        model = CompraFornecedor
        fields = '__all__'


class DespesaSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)

    class Meta:
        model = Despesa
        fields = '__all__'

class ItemVendaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True) # pega o nome de cada produto
    # many=True porque são vários itens
    # read_only=True porque não vamos criar/editar itens por aqui

    class Meta:
        model = ItemVenda
        fields = '__all__'


class VendaSerializer(serializers.ModelSerializer):   
    itens_nomes = serializers.SerializerMethodField() # cria um campo que não existe no banco para nome dos itens

    total = serializers.SerializerMethodField() # cria um campo que não existe no banco para o total da venda

    class Meta:
        model = Venda
        fields = '__all__'

    def get_total(self, obj):
        total = 0
        
        for item in obj.itens.all(): # pega todos os itens da venda e soma os subtotais
            total += item.subtotal
        return total
    
    def get_itens_nomes(self, obj):
        return [item.produto.nome for item in obj.itens.all()]

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


# --- Serializers de input para endpoints atômicos ---

class ItemVendaInputSerializer(serializers.Serializer):
    produto = serializers.CharField()
    quantidade_vendida = serializers.IntegerField(min_value=1)
    preco_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    desconto_aplicado = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, default=0)


class RegistrarVendaSerializer(serializers.Serializer):
    funcionario = serializers.CharField()
    cliente = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    data_venda = serializers.DateField()
    hora = serializers.TimeField()
    forma_pagamento = serializers.ChoiceField(choices=['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'fiado'])
    itens = ItemVendaInputSerializer(many=True)

    def validate(self, data):
        if data.get('forma_pagamento') == 'fiado' and not data.get('cliente'):
            raise serializers.ValidationError("Forma de pagamento 'fiado' requer um cliente.")
        if not data.get('itens'):
            raise serializers.ValidationError("A venda deve ter ao menos um item.")
        return data


class ItemCompraInputSerializer(serializers.Serializer):
    produto = serializers.CharField()
    quantidade = serializers.IntegerField(min_value=1)
    valor_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)


class RegistrarCompraSerializer(serializers.Serializer):
    fornecedor = serializers.CharField()
    funcionario = serializers.CharField()
    data_compra = serializers.DateField()
    status = serializers.CharField(required=False, allow_blank=True, default='')
    entregue = serializers.BooleanField(default=False)
    data_entrega = serializers.DateField(required=False, allow_null=True)
    nota_fiscal = serializers.CharField(required=False, allow_blank=True, default='')
    valor_total = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    itens = ItemCompraInputSerializer(many=True)

    def validate(self, data):
        if not data.get('itens'):
            raise serializers.ValidationError("A compra deve ter ao menos um item.")
        return data


class PagarFiadoSerializer(serializers.Serializer):
    cliente = serializers.CharField()
    valor = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
