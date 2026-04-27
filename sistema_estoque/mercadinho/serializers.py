from rest_framework import serializers
from .models import Produto, Estoque, Fornecedor, Funcionario, CompraFornecedor, ItemCompra, Despesa, ItemVenda, Venda, Cliente

class ProdutoSerializer(serializers.ModelSerializer):
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
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)

    class Meta:
        model = ItemVenda
        fields = '__all__'


class VendaSerializer(serializers.ModelSerializer):   
    itens = ItemVendaSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Venda
        fields = '__all__'

    def get_total(self, obj):
        total = 0
        
        for item in obj.itens.all():
            total += item.subtotal
        return total

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
