from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProdutoViewSet, EstoqueViewSet,
    FornecedorViewSet, FuncionarioViewSet,
    CompraFornecedorViewSet, ItemCompraViewSet,
    DespesaViewSet, ItemVendaViewSet, VendaViewSet ,
    ClienteViewSet
)
 
router = DefaultRouter() # cria um roteador de páginas
router.register(r'produtos', ProdutoViewSet, basename='produto')
router.register(r'estoques', EstoqueViewSet, basename='estoque')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'funcionarios', FuncionarioViewSet, basename='funcionario')
router.register(r'compras', CompraFornecedorViewSet, basename='compra')
router.register(r'itens-compra', ItemCompraViewSet, basename='item-compra')
router.register(r'despesas', DespesaViewSet, basename='despesa')
router.register(r'itens-venda', ItemVendaViewSet, basename='item-venda')
router.register(r'vendas', VendaViewSet, basename='venda')
router.register(r'clientes', ClienteViewSet, basename='cliente')

urlpatterns = [
    path('', include(router.urls)),
]