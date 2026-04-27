from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Produto, Estoque, Fornecedor, Funcionario, CompraFornecedor, ItemCompra, Despesa, ItemVenda, Venda, Cliente
from .serializers import (
    ProdutoSerializer, EstoqueSerializer,
    FornecedorSerializer, FuncionarioSerializer,
    CompraFornecedorSerializer, ItemCompraSerializer,
    DespesaSerializer, ItemVendaSerializer, VendaSerializer, ClienteSerializer
)


class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer


class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.select_related('produto').all()
    serializer_class = EstoqueSerializer

    @action(detail=False, methods=['get'], url_path='alerta-minimo')
    def alerta(self, request):
        estoques_alerta = Estoque.objects.filter(
            quantidade_atual__lt=F("quantidade_minima")
        )
        serializer = self.get_serializer(estoques_alerta, many=True)
        return Response({
            'total': estoques_alerta.count(),
            'resultados': serializer.data
        })


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.all()
    serializer_class = FornecedorSerializer


class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer


class CompraFornecedorViewSet(viewsets.ModelViewSet):
    queryset = CompraFornecedor.objects.select_related('fornecedor', 'funcionario').prefetch_related('itens').all()
    serializer_class = CompraFornecedorSerializer

    # endpoint: /api/compras/pendentes/
    @action(detail=False, methods=['get'], url_path='pendentes')
    def pendentes(self, request):
        pendentes = self.get_queryset().filter(entregue=False)
        serializer = self.get_serializer(pendentes, many=True)
        return Response({
            'total': pendentes.count(),
            'resultados': serializer.data
        })


class ItemCompraViewSet(viewsets.ModelViewSet):
    queryset = ItemCompra.objects.select_related('produto', 'compra').all()
    serializer_class = ItemCompraSerializer


class DespesaViewSet(viewsets.ModelViewSet):
    queryset = Despesa.objects.select_related('funcionario').all()
    serializer_class = DespesaSerializer

    # endpoint: /api/despesas/por-categoria/?categoria=X&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
    @action(detail=False, methods=['get'], url_path='por-categoria')
    def por_categoria(self, request):
        queryset = self.get_queryset()

        categoria = request.query_params.get('categoria')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if categoria:
            queryset = queryset.filter(categoria__icontains=categoria)
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'total': queryset.count(),
            'resultados': serializer.data
        })
class ItemVendaViewSet(viewsets.ModelViewSet): # permite fazer os metodos do CRUD
    queryset = ItemVenda.objects.select_related('produto', 'venda').all() # procura no banco de dados o (produto e venda (FK)) ao mesmo tempo evitando várias queries
# uma query pega os dados do banco de dados, se utlilizasse só o .all ele faria uma query para cada item, e suas Foreigns Keys(produto e venda) o que não seria vantajoso pois a API ficaria lenta
    serializer_class = ItemVendaSerializer # transforma esses dados em JSON


class VendaViewSet(viewsets.ModelViewSet):
    queryset = Venda.objects.select_related('funcionario', 'cliente').prefetch_related('itens').all() # o .prefetch_related('itens') faz uma query só para pegar todos os itens(ItemVenda) da venda sem precisar fazer várias queries
    serializer_class = VendaSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

#Endpoint com filtro de fiado
    def get_queryset(self): # altera os dados antes de fazer a query
        queryset = super().get_queryset() # pega o queryset padrão

        possui_fiado = self.request.query_params.get('possui_fiado') #pega o valor da url

        if possui_fiado is not None: # so funciona se buscar no filtro (/clientes/?possui_fiado=True)
            queryset = queryset.filter(possui_fiado=possui_fiado == 'True')  # trasnforma a resposta em booleano

        return queryset
#Endpoint com histórico de compras    
    @action(detail=True, methods=['get']) #Cria um novo CRUD (histórico)
    def historico(self, request, pk=None):
        cliente = self.get_object() # pega o cliente por id
        vendas = cliente.vendas.all() # pega todas as vendas do cliente

        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if data_inicio:
            vendas = vendas.filter(data_venda__gte=data_inicio) # gte é maior ou igual

        if data_fim:
            vendas = vendas.filter(data_venda__lte=data_fim) # lte é menor ou igual


        serializer = VendaSerializer(vendas, many=True) #many=true porque são várias vendas(uma lista)
        return Response(serializer.data)







        