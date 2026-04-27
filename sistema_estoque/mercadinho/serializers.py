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
    produto_nome = serializers.CharField(source='produto.nome', read_only=True) # pega o nome de cada produto
    # many=True porque são vários itens
    # read_only=True porque não vamos criar/editar itens por aqui

    class Meta:
        model = ItemVenda
        fields = '__all__'


class VendaSerializer(serializers.ModelSerializer):   
    itens = ItemVendaSerializer(many=True, read_only=True) # traz todos os itens da venda (ItemVenda) como uma lista

    total = serializers.SerializerMethodField() # cria um campo que não existe no banco

    class Meta:
        model = Venda
        fields = '__all__'

    def get_total(self, obj):
        total = 0
        
        for item in obj.itens.all(): # pega todos os itens da venda e soma os subtotais
            total += item.subtotal
        return total

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
