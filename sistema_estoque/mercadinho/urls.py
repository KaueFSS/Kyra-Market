from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProdutoViewSet, EstoqueViewSet,
    FornecedorViewSet, FuncionarioViewSet,
    CompraFornecedorViewSet, ItemCompraViewSet,
    DespesaViewSet, ItemVendaViewSet, VendaViewSet,
    ClienteViewSet,
    RegistrarVendaView, RegistrarCompraView, PagarFiadoView,
)

router = DefaultRouter()
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
    path('registrar-venda/', RegistrarVendaView.as_view(), name='registrar-venda'),
    path('registrar-compra/', RegistrarCompraView.as_view(), name='registrar-compra'),
    path('pagar-fiado/', PagarFiadoView.as_view(), name='pagar-fiado'),
]
