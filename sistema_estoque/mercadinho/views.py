import uuid
from datetime import date

from django.db import transaction
from django.db.models import F, Q, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (Cliente, CompraFornecedor, Despesa, Estoque, Fornecedor,
                     Funcionario, ItemCompra, ItemVenda, Produto, Venda)
from .serializers import (ClienteSerializer, CompraFornecedorSerializer,
                          DespesaSerializer, EstoqueSerializer,
                          FornecedorSerializer, FuncionarioSerializer,
                          ItemCompraSerializer, ItemVendaSerializer,
                          PagarFiadoSerializer, ProdutoSerializer,
                          RegistrarCompraSerializer, RegistrarVendaSerializer,
                          VendaSerializer)


def gerar_id(prefix):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


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

    @action(detail=False, methods=['get'], url_path='pendentes')
    def pendentes(self, request):
        pendentes = self.get_queryset().filter(entregue=False)
        serializer = self.get_serializer(pendentes, many=True)
        return Response({
            'total': pendentes.count(),
            'resultados': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='entregar')
    def entregar(self, request, pk=None):
        """Marca uma compra pendente como entregue e atualiza o estoque."""
        compra = self.get_object()

        if compra.entregue:
            return Response(
                {'erro': 'Esta compra já foi marcada como entregue.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                for item in compra.itens.select_related('produto').all():
                    try:
                        estoque = Estoque.objects.select_for_update().get(produto=item.produto)
                    except Estoque.DoesNotExist:
                        raise ValueError(f"Produto '{item.produto.nome}' não tem estoque cadastrado.")
                    estoque.quantidade_atual += item.quantidade
                    estoque.dt_ultima_entrada = date.today()
                    estoque.save()

                compra.entregue = True
                compra.data_entrega = date.today()
                compra.save()
        except ValueError as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(compra)
        return Response(serializer.data)


class ItemCompraViewSet(viewsets.ModelViewSet):
    queryset = ItemCompra.objects.select_related('produto', 'compra').all()
    serializer_class = ItemCompraSerializer

    def perform_create(self, serializer):
        produto = serializer.validated_data['produto']
        quantidade = serializer.validated_data['quantidade']
        compra = serializer.validated_data['compra']

        with transaction.atomic():
            if compra.entregue:
                try:
                    estoque = Estoque.objects.select_for_update().get(produto=produto)
                except Estoque.DoesNotExist:
                    raise DRFValidationError(
                        {"erro": f"Produto '{produto.nome}' não tem estoque cadastrado."}
                    )
                estoque.quantidade_atual += quantidade
                estoque.dt_ultima_entrada = date.today()
                estoque.save()
            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.compra.entregue:
                try:
                    estoque = Estoque.objects.select_for_update().get(produto=instance.produto)
                    estoque.quantidade_atual -= instance.quantidade
                    estoque.save()
                except Estoque.DoesNotExist:
                    pass
            instance.delete()


class DespesaViewSet(viewsets.ModelViewSet):
    queryset = Despesa.objects.select_related('funcionario').all()
    serializer_class = DespesaSerializer

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


class ItemVendaViewSet(viewsets.ModelViewSet):
    queryset = ItemVenda.objects.select_related('produto', 'venda').all()
    serializer_class = ItemVendaSerializer

    def perform_create(self, serializer):
        produto = serializer.validated_data['produto']
        quantidade = serializer.validated_data['quantidade_vendida']

        with transaction.atomic():
            try:
                estoque = Estoque.objects.select_for_update().get(produto=produto)
            except Estoque.DoesNotExist:
                raise DRFValidationError(
                    {"erro": f"Produto '{produto.nome}' não tem estoque cadastrado."}
                )
            if estoque.quantidade_atual < quantidade:
                raise DRFValidationError({
                    "erro": (
                        f"Estoque insuficiente para '{produto.nome}' "
                        f"(disponível: {estoque.quantidade_atual}, pedido: {quantidade})."
                    )
                })
            estoque.quantidade_atual -= quantidade
            estoque.dt_ultima_saida = date.today()
            estoque.save()
            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            try:
                estoque = Estoque.objects.select_for_update().get(produto=instance.produto)
                estoque.quantidade_atual += instance.quantidade_vendida
                estoque.save()
            except Estoque.DoesNotExist:
                pass
            instance.delete()


class VendaViewSet(viewsets.ModelViewSet):
    queryset = Venda.objects.select_related('funcionario', 'cliente').prefetch_related('itens').all()
    serializer_class = VendaSerializer

    @action(detail=False, methods=['get'], url_path='hoje')
    def hoje(self, request):
        hoje = date.today()
        vendas_hoje = self.get_queryset().filter(data_venda=hoje)
        total = vendas_hoje.aggregate(t=Sum('itens__subtotal'))['t'] or 0
        return Response({
            'count': vendas_hoje.count(),
            'total': float(total),
        })


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        possui_fiado = self.request.query_params.get('possui_fiado')
        if possui_fiado is not None:
            queryset = queryset.filter(possui_fiado=possui_fiado == 'True')
        return queryset

    @action(detail=False, methods=['get'], url_path='resumo')
    def resumo(self, request):
        """Retorna totais agregados sem precisar paginar todos os clientes."""
        total_clientes = Cliente.objects.count()
        fiado_qs = Cliente.objects.filter(possui_fiado=True)
        total_fiado = fiado_qs.aggregate(t=Sum('saldo_fiado'))['t'] or 0
        return Response({
            'total_clientes': total_clientes,
            'count_fiado': fiado_qs.count(),
            'total_fiado': float(total_fiado),
        })

    @action(detail=True, methods=['get'])
    def historico(self, request, pk=None):
        cliente = self.get_object()
        vendas = cliente.vendas.all()

        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if data_inicio:
            vendas = vendas.filter(data_venda__gte=data_inicio)
        if data_fim:
            vendas = vendas.filter(data_venda__lte=data_fim)

        serializer = VendaSerializer(vendas, many=True)
        return Response(serializer.data)


# ─── Endpoints atômicos de negócio ────────────────────────────────────────────

class RegistrarVendaView(APIView):
    """
    POST /api/registrar-venda/

    Cria a venda + itens, decrementa estoque e atualiza saldo fiado —
    tudo em uma única transação atômica.
    """

    def post(self, request):
        serializer = RegistrarVendaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                funcionario = Funcionario.objects.get(pk=dados['funcionario'])

                cliente = None
                if dados.get('cliente'):
                    cliente = Cliente.objects.get(pk=dados['cliente'])

                venda = Venda.objects.create(
                    nome=dados.get("nome", ""),
                    id_venda=gerar_id('VND'),
                    data_venda=dados['data_venda'],
                    hora=dados['hora'],
                    forma_pagamento=dados['forma_pagamento'],
                    funcionario=funcionario,
                    cliente=cliente,
                )

                total_venda = 0

                for item_data in dados['itens']:
                    produto = Produto.objects.get(pk=item_data['produto'])

                    try:
                        estoque = Estoque.objects.select_for_update().get(produto=produto)
                    except Estoque.DoesNotExist:
                        raise ValueError(f"Produto '{produto.nome}' não tem estoque cadastrado.")

                    if estoque.quantidade_atual < item_data['quantidade_vendida']:
                        raise ValueError(
                            f"Estoque insuficiente para '{produto.nome}' "
                            f"(disponível: {estoque.quantidade_atual}, pedido: {item_data['quantidade_vendida']})."
                        )

                    subtotal = (
                        item_data['preco_unitario'] * item_data['quantidade_vendida']
                        - item_data['desconto_aplicado']
                    )

                    if subtotal < 0:
                        raise ValueError(
                            f"Desconto maior que o valor do item '{produto.nome}': subtotal negativo."
                        )

                    ItemVenda.objects.create(
                        venda=venda,
                        produto=produto,
                        quantidade_vendida=item_data['quantidade_vendida'],
                        preco_unitario=item_data['preco_unitario'],
                        desconto_aplicado=item_data['desconto_aplicado'],
                        subtotal=subtotal,
                    )

                    estoque.quantidade_atual -= item_data['quantidade_vendida']
                    estoque.dt_ultima_saida = dados['data_venda']
                    estoque.save()

                    total_venda += subtotal

                if cliente:
                    cliente.ultima_compra = dados['data_venda']
                    cliente.total_valor += total_venda
                    if dados['forma_pagamento'] == 'fiado':
                        cliente.saldo_fiado += total_venda
                        cliente.possui_fiado = True
                    cliente.save()

        except (Funcionario.DoesNotExist, Cliente.DoesNotExist, Produto.DoesNotExist) as e:
            return Response({'erro': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        venda_serializer = VendaSerializer(
            Venda.objects.prefetch_related('itens').get(pk=venda.pk)
        )
        return Response(venda_serializer.data, status=status.HTTP_201_CREATED)


class RegistrarCompraView(APIView):
    """
    POST /api/registrar-compra/

    Cria a compra + itens e, se entregue=true, incrementa o estoque —
    tudo em uma única transação atômica.
    """

    def post(self, request):
        serializer = RegistrarCompraSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                fornecedor = Fornecedor.objects.get(pk=dados['fornecedor'])
                funcionario = Funcionario.objects.get(pk=dados['funcionario'])

                compra = CompraFornecedor.objects.create(
                    id_compra=gerar_id('CMP'),
                    fornecedor=fornecedor,
                    funcionario=funcionario,
                    data_compra=dados['data_compra'],
                    status=dados.get('status', ''),
                    entregue=dados['entregue'],
                    data_entrega=dados.get('data_entrega'),
                    nota_fiscal=dados.get('nota_fiscal', ''),
                    valor_total=dados['valor_total'],
                )

                for item_data in dados['itens']:
                    produto = Produto.objects.get(pk=item_data['produto'])

                    ItemCompra.objects.create(
                        compra=compra,
                        produto=produto,
                        quantidade=item_data['quantidade'],
                        valor_unitario=item_data['valor_unitario'],
                    )

                    if dados['entregue']:
                        try:
                            estoque = Estoque.objects.select_for_update().get(produto=produto)
                        except Estoque.DoesNotExist:
                            raise ValueError(f"Produto '{produto.nome}' não tem estoque cadastrado.")

                        estoque.quantidade_atual += item_data['quantidade']
                        estoque.dt_ultima_entrada = dados.get('data_entrega') or dados['data_compra']
                        estoque.save()

        except (Fornecedor.DoesNotExist, Funcionario.DoesNotExist, Produto.DoesNotExist) as e:
            return Response({'erro': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        compra_serializer = CompraFornecedorSerializer(
            CompraFornecedor.objects.prefetch_related('itens').get(pk=compra.pk)
        )
        return Response(compra_serializer.data, status=status.HTTP_201_CREATED)


class LucroMensalView(APIView):
    """
    GET /api/lucro-mensal/

    Retorna receita, custos e lucro líquido do mês corrente.
    Receita  = soma dos subtotais dos itens de venda do mês
    Despesas = soma das despesas do mês
    Compras  = soma das compras entregues no mês
    """

    def get(self, request):
        hoje = date.today()
        ano, mes = hoje.year, hoje.month

        receita = ItemVenda.objects.filter(
            venda__data_venda__year=ano,
            venda__data_venda__month=mes,
        ).aggregate(t=Sum('subtotal'))['t'] or 0

        despesas = Despesa.objects.filter(
            data__year=ano,
            data__month=mes,
        ).aggregate(t=Sum('valor'))['t'] or 0

        compras = CompraFornecedor.objects.filter(
            Q(entregue=True) & (
                Q(data_entrega__year=ano, data_entrega__month=mes) |
                Q(data_entrega__isnull=True, data_compra__year=ano, data_compra__month=mes)
            )
        ).aggregate(t=Sum('valor_total'))['t'] or 0

        lucro = float(receita) - float(despesas) - float(compras)

        return Response({
            'receita': float(receita),
            'despesas': float(despesas),
            'compras': float(compras),
            'lucro': lucro,
            'mes': f"{mes:02d}/{ano}",
        })


class PagarFiadoView(APIView):
    """
    POST /api/pagar-fiado/

    Registra um pagamento de fiado, decrementando o saldo do cliente.
    """

    def post(self, request):
        serializer = PagarFiadoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                cliente = Cliente.objects.select_for_update().get(pk=dados['cliente'])

                if dados['valor'] > cliente.saldo_fiado:
                    raise ValueError(
                        f"Valor R${dados['valor']} supera o saldo de R${cliente.saldo_fiado}."
                    )

                cliente.saldo_fiado -= dados['valor']
                if cliente.saldo_fiado == 0:
                    cliente.possui_fiado = False
                cliente.save()

        except Cliente.DoesNotExist as e:
            return Response({'erro': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ClienteSerializer(cliente).data)
