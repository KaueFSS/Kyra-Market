from decimal import Decimal

from django.db.models import Max, Sum

from .models import Cliente, Estoque, ItemVenda, MovimentoFiado, Venda


ZERO = Decimal("0.00")


def calcular_subtotal_item_venda(quantidade, preco_unitario, desconto_aplicado):
    bruto = Decimal(quantidade) * preco_unitario
    subtotal = bruto - desconto_aplicado
    if subtotal < 0:
        raise ValueError("Desconto maior que o valor do item: subtotal negativo.")
    return subtotal


def calcular_total_venda(venda):
    total = venda.itens.aggregate(t=Sum("subtotal"))["t"]
    return total or ZERO


def calcular_total_compra(compra):
    total = ZERO
    for item in compra.itens.all():
        total += Decimal(item.quantidade) * item.valor_unitario
    return total


def ajustar_estoque(produto, delta, data_movimento=None):
    if delta == 0:
        return

    try:
        estoque = Estoque.objects.select_for_update().get(produto=produto)
    except Estoque.DoesNotExist:
        raise ValueError(f"Produto '{produto.nome}' nao tem estoque cadastrado.")

    nova_quantidade = estoque.quantidade_atual + delta
    if nova_quantidade < 0:
        raise ValueError(
            f"Estoque insuficiente para '{produto.nome}' "
            f"(disponivel: {estoque.quantidade_atual}, ajuste: {delta})."
        )

    estoque.quantidade_atual = nova_quantidade
    if delta > 0:
        estoque.dt_ultima_entrada = data_movimento
    else:
        estoque.dt_ultima_saida = data_movimento
    estoque.save()


def registrar_movimento_fiado(cliente, tipo, valor, venda=None, limitar_saldo_zero=False):
    valor = Decimal(valor)
    if valor == 0:
        return None

    cliente = Cliente.objects.select_for_update().get(pk=cliente.pk)
    saldo_anterior = cliente.saldo_fiado
    saldo_atual = saldo_anterior + valor

    if saldo_atual < 0:
        if limitar_saldo_zero:
            valor = -saldo_anterior
            saldo_atual = ZERO
            if valor == 0:
                return None
        else:
            raise ValueError(
                f"Movimento de fiado deixaria saldo negativo para '{cliente.nome}'."
            )

    cliente.saldo_fiado = saldo_atual
    cliente.possui_fiado = saldo_atual > 0
    cliente.save(update_fields=["saldo_fiado", "possui_fiado"])

    return MovimentoFiado.objects.create(
        cliente=cliente,
        venda=venda,
        tipo=tipo,
        valor=valor,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
    )


def registrar_saldo_inicial_fiado(cliente):
    if cliente.saldo_fiado <= 0:
        return None

    return MovimentoFiado.objects.create(
        cliente=cliente,
        tipo=MovimentoFiado.SALDO_INICIAL,
        valor=cliente.saldo_fiado,
        saldo_anterior=ZERO,
        saldo_atual=cliente.saldo_fiado,
    )


def validar_venda_fiada(forma_pagamento, cliente):
    if forma_pagamento == "fiado" and cliente is None:
        raise ValueError("Forma de pagamento 'fiado' requer um cliente.")


def recalcular_cliente_compras(cliente):
    cliente = Cliente.objects.select_for_update().get(pk=cliente.pk)
    agregados = Venda.objects.filter(cliente=cliente).aggregate(
        total=Sum("itens__subtotal"),
        ultima=Max("data_venda"),
    )
    cliente.total_valor = agregados["total"] or ZERO
    cliente.ultima_compra = agregados["ultima"]
    cliente.possui_fiado = cliente.saldo_fiado > 0
    cliente.save(update_fields=["total_valor", "ultima_compra", "possui_fiado"])
    return cliente


def ajustar_fiado_por_alteracao_venda(
    venda,
    cliente_anterior=None,
    forma_anterior=None,
    total_anterior=ZERO,
):
    total_atual = calcular_total_venda(venda)
    validar_venda_fiada(venda.forma_pagamento, venda.cliente)

    tinha_fiado = forma_anterior == "fiado" and cliente_anterior is not None
    tem_fiado = venda.forma_pagamento == "fiado" and venda.cliente is not None

    if tinha_fiado and tem_fiado and cliente_anterior.pk == venda.cliente.pk:
        registrar_movimento_fiado(
            venda.cliente,
            MovimentoFiado.AJUSTE_EDICAO,
            total_atual - total_anterior,
            venda=venda,
            limitar_saldo_zero=True,
        )
        return

    if tinha_fiado:
        registrar_movimento_fiado(
            cliente_anterior,
            MovimentoFiado.AJUSTE_EDICAO,
            -total_anterior,
            venda=venda,
            limitar_saldo_zero=True,
        )

    if tem_fiado:
        registrar_movimento_fiado(
            venda.cliente,
            MovimentoFiado.AJUSTE_EDICAO,
            total_atual,
            venda=venda,
        )


def registrar_venda_fiada(venda):
    validar_venda_fiada(venda.forma_pagamento, venda.cliente)
    if venda.forma_pagamento != "fiado":
        return
    registrar_movimento_fiado(
        venda.cliente,
        MovimentoFiado.VENDA_FIADA,
        calcular_total_venda(venda),
        venda=venda,
    )


def desfazer_fiado_venda(venda):
    if venda.forma_pagamento == "fiado" and venda.cliente is not None:
        registrar_movimento_fiado(
            venda.cliente,
            MovimentoFiado.AJUSTE_EDICAO,
            -calcular_total_venda(venda),
            venda=venda,
            limitar_saldo_zero=True,
        )


def atualizar_subtotal_item_venda(item):
    item.subtotal = calcular_subtotal_item_venda(
        item.quantidade_vendida,
        item.preco_unitario,
        item.desconto_aplicado,
    )
    return item
