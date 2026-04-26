from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Produto, Estoque, Fornecedor, Funcionario, CompraFornecedor, ItemCompra, Despesa
from .serializers import (
    ProdutoSerializer, EstoqueSerializer,
    FornecedorSerializer, FuncionarioSerializer,
    CompraFornecedorSerializer, ItemCompraSerializer,
    DespesaSerializer,
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
        