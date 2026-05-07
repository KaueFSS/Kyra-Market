import uuid
from datetime import date

from django.db import transaction
from django.db.models import F, Q, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Cliente,
    CompraFornecedor,
    Despesa,
    Estoque,
    Fornecedor,
    Funcionario,
    ItemCompra,
    ItemVenda,
    MovimentoFiado,
    Produto,
    Venda,
)
from .serializers import (
    ClienteSerializer,
    CompraFornecedorSerializer,
    DespesaSerializer,
    EstoqueSerializer,
    FornecedorSerializer,
    FuncionarioSerializer,
    ItemCompraSerializer,
    ItemVendaSerializer,
    MovimentoFiadoSerializer,
    PagarFiadoSerializer,
    ProdutoSerializer,
    RegistrarCompraSerializer,
    RegistrarVendaSerializer,
    VendaSerializer,
)
from .services import (
    ajustar_estoque,
    ajustar_fiado_por_alteracao_venda,
    atualizar_subtotal_item_venda,
    calcular_subtotal_item_venda,
    calcular_total_compra,
    calcular_total_venda,
    desfazer_fiado_venda,
    recalcular_cliente_compras,
    registrar_movimento_fiado,
    registrar_saldo_inicial_fiado,
    registrar_venda_fiada,
    validar_venda_fiada,
)


def gerar_id(prefix):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


def gerar_id_despesa():
    return f"DSP{uuid.uuid4().hex[:7].upper()}"


def descricao_despesa_compra(compra):
    return f"Compra {compra.id_compra} - {compra.fornecedor.razao_social}"[:100]


def sincronizar_despesa_compra(compra):
    despesa = Despesa.objects.filter(
        compra=compra,
        categoria="Compra de mercadorias",
    ).first()

    if despesa is None:
        despesa = Despesa(
            id_despesa=gerar_id_despesa(),
            compra=compra,
            categoria="Compra de mercadorias",
        )

    despesa.funcionario = compra.funcionario
    despesa.data = compra.data_compra
    despesa.descricao = descricao_despesa_compra(compra)
    despesa.valor = compra.valor_total
    despesa.recorrente = False
    despesa.save()
    return despesa


class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer


class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.select_related("produto").all()
    serializer_class = EstoqueSerializer

    @action(detail=False, methods=["get"], url_path="alerta-minimo")
    def alerta(self, request):
        estoques_alerta = Estoque.objects.filter(
            quantidade_atual__lt=F("quantidade_minima")
        )
        serializer = self.get_serializer(estoques_alerta, many=True)
        return Response({
            "total": estoques_alerta.count(),
            "resultados": serializer.data,
        })


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.all()
    serializer_class = FornecedorSerializer


class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer


class CompraFornecedorViewSet(viewsets.ModelViewSet):
    queryset = CompraFornecedor.objects.select_related(
        "fornecedor", "funcionario"
    ).prefetch_related("itens").all()
    serializer_class = CompraFornecedorSerializer

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                compra_atual = CompraFornecedor.objects.select_for_update().get(
                    pk=serializer.instance.pk
                )
                entregue_anterior = compra_atual.entregue
                compra = serializer.save()

                if not entregue_anterior and compra.entregue:
                    for item in compra.itens.select_related("produto").all():
                        ajustar_estoque(
                            item.produto,
                            item.quantidade,
                            compra.data_entrega or date.today(),
                        )
                elif entregue_anterior and not compra.entregue:
                    for item in compra.itens.select_related("produto").all():
                        ajustar_estoque(item.produto, -item.quantidade, date.today())

                compra.valor_total = calcular_total_compra(compra)
                compra.save(update_fields=["valor_total"])
                sincronizar_despesa_compra(compra)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                compra = CompraFornecedor.objects.select_for_update().get(pk=instance.pk)
                if compra.entregue:
                    for item in compra.itens.select_related("produto").all():
                        ajustar_estoque(item.produto, -item.quantidade, date.today())
                compra.despesas.filter(categoria="Compra de mercadorias").delete()
                compra.delete()
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    @action(detail=False, methods=["get"], url_path="pendentes")
    def pendentes(self, request):
        pendentes = self.get_queryset().filter(entregue=False)
        serializer = self.get_serializer(pendentes, many=True)
        return Response({
            "total": pendentes.count(),
            "resultados": serializer.data,
        })

    @action(detail=True, methods=["post"], url_path="entregar")
    def entregar(self, request, pk=None):
        try:
            with transaction.atomic():
                compra = CompraFornecedor.objects.select_for_update().get(
                    pk=self.get_object().pk
                )
                if compra.entregue:
                    return Response(
                        {"erro": "Esta compra ja foi marcada como entregue."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                for item in compra.itens.select_related("produto").all():
                    ajustar_estoque(item.produto, item.quantidade, date.today())

                compra.entregue = True
                compra.data_entrega = date.today()
                compra.valor_total = calcular_total_compra(compra)
                compra.save()
                sincronizar_despesa_compra(compra)
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(compra)
        return Response(serializer.data)


class ItemCompraViewSet(viewsets.ModelViewSet):
    queryset = ItemCompra.objects.select_related("produto", "compra").all()
    serializer_class = ItemCompraSerializer

    def perform_create(self, serializer):
        produto = serializer.validated_data["produto"]
        quantidade = serializer.validated_data["quantidade"]
        compra = serializer.validated_data["compra"]

        try:
            with transaction.atomic():
                if compra.entregue:
                    ajustar_estoque(produto, quantidade, date.today())
                serializer.save()
                compra.valor_total = calcular_total_compra(compra)
                compra.save(update_fields=["valor_total"])
                sincronizar_despesa_compra(compra)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                item_atual = ItemCompra.objects.select_for_update().select_related(
                    "produto", "compra"
                ).get(pk=serializer.instance.pk)
                quantidade_anterior = item_atual.quantidade
                produto_anterior = item_atual.produto
                compra = item_atual.compra
                item = serializer.save()

                if compra.entregue:
                    if produto_anterior.pk == item.produto_id:
                        ajustar_estoque(
                            item.produto,
                            item.quantidade - quantidade_anterior,
                            date.today(),
                        )
                    else:
                        ajustar_estoque(produto_anterior, -quantidade_anterior, date.today())
                        ajustar_estoque(item.produto, item.quantidade, date.today())

                compra.valor_total = calcular_total_compra(compra)
                compra.save(update_fields=["valor_total"])
                sincronizar_despesa_compra(compra)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                item = ItemCompra.objects.select_for_update().select_related(
                    "produto", "compra"
                ).get(pk=instance.pk)
                compra = item.compra
                if compra.entregue:
                    ajustar_estoque(item.produto, -item.quantidade, date.today())
                item.delete()
                compra.valor_total = calcular_total_compra(compra)
                compra.save(update_fields=["valor_total"])
                sincronizar_despesa_compra(compra)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})


class DespesaViewSet(viewsets.ModelViewSet):
    queryset = Despesa.objects.select_related("funcionario").all()
    serializer_class = DespesaSerializer

    @action(detail=False, methods=["get"], url_path="por-categoria")
    def por_categoria(self, request):
        queryset = self.get_queryset()

        categoria = request.query_params.get("categoria")
        data_inicio = request.query_params.get("data_inicio")
        data_fim = request.query_params.get("data_fim")

        if categoria:
            queryset = queryset.filter(categoria__icontains=categoria)
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "total": queryset.count(),
            "resultados": serializer.data,
        })


class ItemVendaViewSet(viewsets.ModelViewSet):
    queryset = ItemVenda.objects.select_related("produto", "venda").all()
    serializer_class = ItemVendaSerializer

    def perform_create(self, serializer):
        produto = serializer.validated_data["produto"]
        quantidade = serializer.validated_data["quantidade_vendida"]
        venda = serializer.validated_data["venda"]
        subtotal = calcular_subtotal_item_venda(
            quantidade,
            serializer.validated_data["preco_unitario"],
            serializer.validated_data.get("desconto_aplicado") or 0,
        )

        try:
            with transaction.atomic():
                total_anterior = calcular_total_venda(venda)
                ajustar_estoque(produto, -quantidade, date.today())
                serializer.save(subtotal=subtotal)
                ajustar_fiado_por_alteracao_venda(
                    venda,
                    cliente_anterior=venda.cliente,
                    forma_anterior=venda.forma_pagamento,
                    total_anterior=total_anterior,
                )
                if venda.cliente:
                    recalcular_cliente_compras(venda.cliente)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                item_atual = ItemVenda.objects.select_for_update().select_related(
                    "produto", "venda__cliente"
                ).get(pk=serializer.instance.pk)
                venda = item_atual.venda
                cliente_anterior = venda.cliente
                forma_anterior = venda.forma_pagamento
                total_anterior = calcular_total_venda(venda)
                produto_anterior = item_atual.produto
                quantidade_anterior = item_atual.quantidade_vendida

                item = serializer.save()
                atualizar_subtotal_item_venda(item)
                ajustar_estoque(produto_anterior, quantidade_anterior, date.today())
                ajustar_estoque(item.produto, -item.quantidade_vendida, date.today())
                item.save(update_fields=["subtotal"])
                ajustar_fiado_por_alteracao_venda(
                    venda,
                    cliente_anterior=cliente_anterior,
                    forma_anterior=forma_anterior,
                    total_anterior=total_anterior,
                )
                if cliente_anterior:
                    recalcular_cliente_compras(cliente_anterior)
                if venda.cliente and (
                    cliente_anterior is None or venda.cliente_id != cliente_anterior.pk
                ):
                    recalcular_cliente_compras(venda.cliente)
                elif venda.cliente:
                    recalcular_cliente_compras(venda.cliente)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                item = ItemVenda.objects.select_for_update().select_related(
                    "produto", "venda__cliente"
                ).get(pk=instance.pk)
                venda = item.venda
                cliente_anterior = venda.cliente
                forma_anterior = venda.forma_pagamento
                total_anterior = calcular_total_venda(venda)

                ajustar_estoque(item.produto, item.quantidade_vendida, date.today())
                item.delete()
                ajustar_fiado_por_alteracao_venda(
                    venda,
                    cliente_anterior=cliente_anterior,
                    forma_anterior=forma_anterior,
                    total_anterior=total_anterior,
                )
                if cliente_anterior:
                    recalcular_cliente_compras(cliente_anterior)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})


class VendaViewSet(viewsets.ModelViewSet):
    queryset = Venda.objects.select_related("funcionario", "cliente").prefetch_related(
        "itens"
    ).all()
    serializer_class = VendaSerializer

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                venda_atual = Venda.objects.select_for_update().select_related(
                    "cliente"
                ).get(pk=serializer.instance.pk)
                cliente_anterior = venda_atual.cliente
                forma_anterior = venda_atual.forma_pagamento
                total_anterior = calcular_total_venda(venda_atual)
                venda = serializer.save()

                validar_venda_fiada(venda.forma_pagamento, venda.cliente)
                ajustar_fiado_por_alteracao_venda(
                    venda,
                    cliente_anterior=cliente_anterior,
                    forma_anterior=forma_anterior,
                    total_anterior=total_anterior,
                )
                if cliente_anterior:
                    recalcular_cliente_compras(cliente_anterior)
                if venda.cliente and (
                    cliente_anterior is None or venda.cliente_id != cliente_anterior.pk
                ):
                    recalcular_cliente_compras(venda.cliente)
                elif venda.cliente:
                    recalcular_cliente_compras(venda.cliente)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                venda = Venda.objects.select_for_update().select_related(
                    "cliente"
                ).prefetch_related("itens__produto").get(pk=instance.pk)
                cliente_anterior = venda.cliente
                desfazer_fiado_venda(venda)
                for item in venda.itens.all():
                    ajustar_estoque(item.produto, item.quantidade_vendida, date.today())
                venda.delete()
                if cliente_anterior:
                    recalcular_cliente_compras(cliente_anterior)
        except ValueError as e:
            raise DRFValidationError({"erro": str(e)})

    @action(detail=False, methods=["get"], url_path="hoje")
    def hoje(self, request):
        hoje = date.today()
        vendas_hoje = self.get_queryset().filter(data_venda=hoje)
        total = vendas_hoje.aggregate(t=Sum("itens__subtotal"))["t"] or 0
        return Response({
            "count": vendas_hoje.count(),
            "total": float(total),
        })


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            cliente = serializer.save()
            registrar_saldo_inicial_fiado(cliente)

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        possui_fiado = self.request.query_params.get("possui_fiado")
        if possui_fiado is not None:
            queryset = queryset.filter(possui_fiado=str(possui_fiado).lower() == "true")
        return queryset

    @action(detail=False, methods=["get"], url_path="resumo")
    def resumo(self, request):
        total_clientes = Cliente.objects.count()
        fiado_qs = Cliente.objects.filter(possui_fiado=True)
        total_fiado = fiado_qs.aggregate(t=Sum("saldo_fiado"))["t"] or 0
        return Response({
            "total_clientes": total_clientes,
            "count_fiado": fiado_qs.count(),
            "total_fiado": float(total_fiado),
        })

    @action(detail=True, methods=["get"])
    def historico(self, request, pk=None):
        cliente = self.get_object()
        vendas = cliente.vendas.all()

        data_inicio = request.query_params.get("data_inicio")
        data_fim = request.query_params.get("data_fim")

        if data_inicio:
            vendas = vendas.filter(data_venda__gte=data_inicio)
        if data_fim:
            vendas = vendas.filter(data_venda__lte=data_fim)

        serializer = VendaSerializer(vendas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="movimentos-fiado")
    def movimentos_fiado(self, request, pk=None):
        cliente = self.get_object()
        movimentos = cliente.movimentos_fiado.select_related("venda").all()
        serializer = MovimentoFiadoSerializer(movimentos, many=True)
        return Response(serializer.data)


class RegistrarVendaView(APIView):
    def post(self, request):
        serializer = RegistrarVendaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                funcionario = Funcionario.objects.get(pk=dados["funcionario"])
                cliente = None
                if dados.get("cliente"):
                    cliente = Cliente.objects.select_for_update().get(pk=dados["cliente"])

                validar_venda_fiada(dados["forma_pagamento"], cliente)

                venda = Venda.objects.create(
                    nome=dados.get("nome", ""),
                    id_venda=gerar_id("VND"),
                    data_venda=dados["data_venda"],
                    hora=dados["hora"],
                    forma_pagamento=dados["forma_pagamento"],
                    funcionario=funcionario,
                    cliente=cliente,
                )

                for item_data in dados["itens"]:
                    produto = Produto.objects.get(pk=item_data["produto"])
                    subtotal = calcular_subtotal_item_venda(
                        item_data["quantidade_vendida"],
                        item_data["preco_unitario"],
                        item_data["desconto_aplicado"],
                    )
                    ItemVenda.objects.create(
                        venda=venda,
                        produto=produto,
                        quantidade_vendida=item_data["quantidade_vendida"],
                        preco_unitario=item_data["preco_unitario"],
                        desconto_aplicado=item_data["desconto_aplicado"],
                        subtotal=subtotal,
                    )
                    ajustar_estoque(
                        produto,
                        -item_data["quantidade_vendida"],
                        dados["data_venda"],
                    )

                if cliente:
                    registrar_venda_fiada(venda)
                    recalcular_cliente_compras(cliente)

        except (Funcionario.DoesNotExist, Cliente.DoesNotExist, Produto.DoesNotExist) as e:
            return Response({"erro": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        venda_serializer = VendaSerializer(
            Venda.objects.prefetch_related("itens").get(pk=venda.pk)
        )
        return Response(venda_serializer.data, status=status.HTTP_201_CREATED)


class RegistrarCompraView(APIView):
    def post(self, request):
        serializer = RegistrarCompraSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                fornecedor = Fornecedor.objects.get(pk=dados["fornecedor"])
                funcionario = Funcionario.objects.get(pk=dados["funcionario"])

                compra = CompraFornecedor.objects.create(
                    id_compra=gerar_id("CMP"),
                    nome=dados.get("nome", ""),
                    fornecedor=fornecedor,
                    funcionario=funcionario,
                    data_compra=dados["data_compra"],
                    status=dados.get("status", ""),
                    entregue=dados["entregue"],
                    data_entrega=dados.get("data_entrega"),
                    nota_fiscal=dados.get("nota_fiscal", ""),
                    valor_total=0,
                )

                for item_data in dados["itens"]:
                    produto = Produto.objects.get(pk=item_data["produto"])
                    ItemCompra.objects.create(
                        compra=compra,
                        produto=produto,
                        quantidade=item_data["quantidade"],
                        valor_unitario=item_data["valor_unitario"],
                    )

                    if dados["entregue"]:
                        ajustar_estoque(
                            produto,
                            item_data["quantidade"],
                            dados.get("data_entrega") or dados["data_compra"],
                        )

                compra.valor_total = calcular_total_compra(compra)
                compra.save(update_fields=["valor_total"])
                sincronizar_despesa_compra(compra)

        except (Fornecedor.DoesNotExist, Funcionario.DoesNotExist, Produto.DoesNotExist) as e:
            return Response({"erro": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        compra_serializer = CompraFornecedorSerializer(
            CompraFornecedor.objects.prefetch_related("itens").get(pk=compra.pk)
        )
        return Response(compra_serializer.data, status=status.HTTP_201_CREATED)


class LucroMensalView(APIView):
    def get(self, request):
        hoje = date.today()
        ano, mes = hoje.year, hoje.month

        receita = ItemVenda.objects.filter(
            venda__data_venda__year=ano,
            venda__data_venda__month=mes,
        ).aggregate(t=Sum("subtotal"))["t"] or 0

        despesas = Despesa.objects.filter(
            compra__isnull=True,
            data__year=ano,
            data__month=mes,
        ).aggregate(t=Sum("valor"))["t"] or 0

        compras = CompraFornecedor.objects.filter(
            Q(entregue=True) & (
                Q(data_entrega__year=ano, data_entrega__month=mes) |
                Q(
                    data_entrega__isnull=True,
                    data_compra__year=ano,
                    data_compra__month=mes,
                )
            )
        ).aggregate(t=Sum("valor_total"))["t"] or 0

        lucro = float(receita) - float(despesas) - float(compras)

        return Response({
            "receita": float(receita),
            "despesas": float(despesas),
            "compras": float(compras),
            "lucro": lucro,
            "mes": f"{mes:02d}/{ano}",
        })


class PagarFiadoView(APIView):
    def post(self, request):
        serializer = PagarFiadoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        dados = serializer.validated_data

        try:
            with transaction.atomic():
                cliente = Cliente.objects.select_for_update().get(pk=dados["cliente"])
                if dados["valor"] > cliente.saldo_fiado:
                    raise ValueError(
                        f"Valor R${dados['valor']} supera o saldo de R${cliente.saldo_fiado}."
                    )
                registrar_movimento_fiado(
                    cliente,
                    MovimentoFiado.PAGAMENTO,
                    -dados["valor"],
                )
        except Cliente.DoesNotExist as e:
            return Response({"erro": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        cliente.refresh_from_db()
        return Response(ClienteSerializer(cliente).data)
