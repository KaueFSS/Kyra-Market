from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProdutoViewSet, EstoqueViewSet,
    FornecedorViewSet, FuncionarioViewSet,
    CompraFornecedorViewSet, ItemCompraViewSet,
    DespesaViewSet,
)

router = DefaultRouter()
router.register(r'produtos', ProdutoViewSet, basename='produto')
router.register(r'estoques', EstoqueViewSet, basename='estoque')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'funcionarios', FuncionarioViewSet, basename='funcionario')
router.register(r'compras', CompraFornecedorViewSet, basename='compra')
router.register(r'itens-compra', ItemCompraViewSet, basename='item-compra')
router.register(r'despesas', DespesaViewSet, basename='despesa')

urlpatterns = [
    path('', include(router.urls)),
]