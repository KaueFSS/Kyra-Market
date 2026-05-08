from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

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


class RegrasFinanceirasTests(APITestCase):
    def setUp(self):
        self.funcionario = Funcionario.objects.create(
            id_funcionario="FUN0000001",
            nome="Operador",
            cargo="Caixa",
            data_admissao="2026-01-01",
            turno="Manha",
            salario=Decimal("1500.00"),
            horas_semanais=Decimal("40.00"),
            ativo=True,
        )
        self.fornecedor = Fornecedor.objects.create(
            id_fornecedor="FOR0000001",
            razao_social="Fornecedor Teste",
            nome_fantasia="Fornecedor",
            cnpj="00.000.000/0001-00",
            cidade="Rio de Janeiro",
            uf="RJ",
        )
        self.produto = Produto.objects.create(
            id_produto="PRO0000001",
            fornecedor=self.fornecedor,
            nome="Arroz",
            preco_custo=Decimal("3.00"),
            preco=Decimal("10.00"),
        )
        self.estoque = Estoque.objects.create(
            id_estoque="EST0000001",
            produto=self.produto,
            quantidade_atual=10,
            quantidade_minima=1,
        )

    def criar_cliente(self, id_cliente="CLI0000001", saldo="0.00"):
        return Cliente.objects.create(
            id_cliente=id_cliente,
            nome=f"Cliente {id_cliente}",
            data_cadastro="2026-05-01",
            saldo_fiado=Decimal(saldo),
            possui_fiado=Decimal(saldo) > 0,
        )

    def registrar_venda(self, forma="fiado", cliente="CLI0000001", quantidade=2, desconto="0.00"):
        payload = {
            "nome": "Venda teste",
            "funcionario": self.funcionario.pk,
            "cliente": cliente,
            "data_venda": "2026-05-08",
            "hora": "10:00:00",
            "forma_pagamento": forma,
            "itens": [
                {
                    "produto": self.produto.pk,
                    "quantidade_vendida": quantidade,
                    "preco_unitario": "10.00",
                    "desconto_aplicado": desconto,
                }
            ],
        }
        return self.client.post("/api/registrar-venda/", payload, format="json")

    def registrar_compra(self, entregue=True, quantidade=4):
        payload = {
            "nome": "Compra teste",
            "fornecedor": self.fornecedor.pk,
            "funcionario": self.funcionario.pk,
            "data_compra": "2026-05-08",
            "status": "Entregue" if entregue else "Pendente",
            "entregue": entregue,
            "data_entrega": "2026-05-08" if entregue else None,
            "valor_total": "999.00",
            "itens": [
                {
                    "produto": self.produto.pk,
                    "quantidade": quantidade,
                    "valor_unitario": "3.00",
                }
            ],
        }
        return self.client.post("/api/registrar-compra/", payload, format="json")

    def test_cliente_com_saldo_inicial_forca_fiado_e_cria_movimento(self):
        response = self.client.post(
            "/api/clientes/",
            {
                "id_cliente": "CLI0000001",
                "nome": "Maria",
                "possui_fiado": False,
                "saldo_fiado": "50.00",
                "data_cadastro": "2026-05-01",
                "total_valor": "999.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cliente = Cliente.objects.get(pk="CLI0000001")
        self.assertTrue(cliente.possui_fiado)
        self.assertEqual(cliente.saldo_fiado, Decimal("50.00"))
        movimento = MovimentoFiado.objects.get(cliente=cliente)
        self.assertEqual(movimento.tipo, MovimentoFiado.SALDO_INICIAL)
        self.assertEqual(movimento.saldo_anterior, Decimal("0.00"))
        self.assertEqual(movimento.saldo_atual, Decimal("50.00"))

    def test_venda_fiada_cria_saldo_movimento_e_pagamento_reduz(self):
        cliente = self.criar_cliente()

        response = self.registrar_venda()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        cliente.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("20.00"))
        self.assertTrue(cliente.possui_fiado)
        self.assertEqual(cliente.total_valor, Decimal("20.00"))
        self.assertEqual(self.estoque.quantidade_atual, 8)
        self.assertTrue(
            MovimentoFiado.objects.filter(cliente=cliente, tipo=MovimentoFiado.VENDA_FIADA).exists()
        )

        pagamento = self.client.post(
            "/api/pagar-fiado/",
            {"cliente": cliente.pk, "valor": "5.00"},
            format="json",
        )
        self.assertEqual(pagamento.status_code, status.HTTP_200_OK)
        cliente.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("15.00"))

        pagamento_alto = self.client.post(
            "/api/pagar-fiado/",
            {"cliente": cliente.pk, "valor": "99.00"},
            format="json",
        )
        self.assertEqual(pagamento_alto.status_code, status.HTTP_400_BAD_REQUEST)

    def test_editar_venda_fiada_para_pix_remove_saldo(self):
        cliente = self.criar_cliente()
        response = self.registrar_venda()
        venda_id = response.data["id_venda"]

        response = self.client.patch(
            f"/api/vendas/{venda_id}/",
            {"forma_pagamento": "pix"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        cliente.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("0.00"))
        self.assertFalse(cliente.possui_fiado)

    def test_editar_venda_com_payload_completo_da_tela(self):
        self.criar_cliente()
        response = self.registrar_venda()
        venda_id = response.data["id_venda"]

        detalhes = self.client.get(f"/api/vendas/{venda_id}/")
        payload = dict(detalhes.data)
        payload["nome"] = "Venda editada"
        payload["forma_pagamento"] = "pix"
        payload["cliente"] = None

        response = self.client.patch(
            f"/api/vendas/{venda_id}/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["nome"], "Venda editada")
        self.assertIn("itens", response.data)
        self.assertEqual(len(response.data["itens"]), 1)

    def test_editar_pix_para_fiado_exige_cliente_e_adiciona_saldo(self):
        cliente = self.criar_cliente()
        response = self.registrar_venda(forma="pix", cliente=None)
        venda_id = response.data["id_venda"]

        sem_cliente = self.client.patch(
            f"/api/vendas/{venda_id}/",
            {"forma_pagamento": "fiado"},
            format="json",
        )
        self.assertEqual(sem_cliente.status_code, status.HTTP_400_BAD_REQUEST)

        com_cliente = self.client.patch(
            f"/api/vendas/{venda_id}/",
            {"forma_pagamento": "fiado", "cliente": cliente.pk},
            format="json",
        )
        self.assertEqual(com_cliente.status_code, status.HTTP_200_OK)
        cliente.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("20.00"))

    def test_editar_item_venda_recalcula_subtotal_estoque_e_fiado(self):
        cliente = self.criar_cliente()
        response = self.registrar_venda()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item = ItemVenda.objects.get()

        response = self.client.patch(
            f"/api/itens-venda/{item.pk}/",
            {
                "quantidade_vendida": 3,
                "preco_unitario": "10.00",
                "desconto_aplicado": "5.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        cliente.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(item.subtotal, Decimal("25.00"))
        self.assertEqual(cliente.saldo_fiado, Decimal("25.00"))
        self.assertEqual(cliente.total_valor, Decimal("25.00"))
        self.assertEqual(self.estoque.quantidade_atual, 7)

    def test_excluir_venda_devolve_estoque_e_ajusta_fiado(self):
        cliente = self.criar_cliente()
        response = self.registrar_venda()
        venda_id = response.data["id_venda"]

        response = self.client.delete(f"/api/vendas/{venda_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        cliente.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("0.00"))
        self.assertEqual(cliente.total_valor, Decimal("0.00"))
        self.assertEqual(self.estoque.quantidade_atual, 10)

    def test_editar_e_excluir_venda_fiada_ja_paga_zeram_saldo(self):
        cliente = self.criar_cliente()
        response = self.registrar_venda()
        venda_id = response.data["id_venda"]

        pagamento = self.client.post(
            "/api/pagar-fiado/",
            {"cliente": cliente.pk, "valor": "15.00"},
            format="json",
        )
        self.assertEqual(pagamento.status_code, status.HTTP_200_OK)

        response = self.client.patch(
            f"/api/vendas/{venda_id}/",
            {"forma_pagamento": "pix", "cliente": None},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        cliente.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("0.00"))

        response = self.registrar_venda()
        venda_id = response.data["id_venda"]
        pagamento = self.client.post(
            "/api/pagar-fiado/",
            {"cliente": cliente.pk, "valor": "20.00"},
            format="json",
        )
        self.assertEqual(pagamento.status_code, status.HTTP_200_OK)

        response = self.client.delete(f"/api/vendas/{venda_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        cliente.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(cliente.saldo_fiado, Decimal("0.00"))
        self.assertEqual(self.estoque.quantidade_atual, 8)

    def test_excluir_cadastros_vinculados_retorna_erro_claro(self):
        cliente = self.criar_cliente()
        venda = self.registrar_venda()
        compra = self.registrar_compra(entregue=False)
        self.assertEqual(venda.status_code, status.HTTP_201_CREATED)
        self.assertEqual(compra.status_code, status.HTTP_201_CREATED)

        endpoints = [
            f"/api/clientes/{cliente.pk}/",
            f"/api/funcionarios/{self.funcionario.pk}/",
            f"/api/produtos/{self.produto.pk}/",
            f"/api/fornecedores/{self.fornecedor.pk}/",
        ]

        for endpoint in endpoints:
            response = self.client.delete(endpoint)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, endpoint)
            self.assertIn("erro", response.data)
            self.assertIn("vinculado", response.data["erro"])

    def test_excluir_produto_sem_historico_remove_estoque_junto(self):
        response = self.client.delete(f"/api/produtos/{self.produto.pk}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Produto.objects.filter(pk=self.produto.pk).exists())
        self.assertFalse(Estoque.objects.filter(pk=self.estoque.pk).exists())

    def test_compra_entregue_altera_estoque_total_e_despesa(self):
        response = self.registrar_compra(entregue=True, quantidade=4)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        compra = CompraFornecedor.objects.get()
        despesa = Despesa.objects.get(compra=compra)
        self.estoque.refresh_from_db()
        self.assertEqual(compra.valor_total, Decimal("12.00"))
        self.assertEqual(despesa.valor, Decimal("12.00"))
        self.assertEqual(self.estoque.quantidade_atual, 14)

    def test_editar_e_excluir_item_compra_recalcula_total_despesa_e_estoque(self):
        self.registrar_compra(entregue=True, quantidade=4)
        compra = CompraFornecedor.objects.get()
        item = ItemCompra.objects.get(compra=compra)

        response = self.client.patch(
            f"/api/itens-compra/{item.pk}/",
            {"quantidade": 2, "valor_unitario": "3.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        compra.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(compra.valor_total, Decimal("6.00"))
        self.assertEqual(compra.despesas.get().valor, Decimal("6.00"))
        self.assertEqual(self.estoque.quantidade_atual, 12)

        response = self.client.delete(f"/api/itens-compra/{item.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        compra.refresh_from_db()
        self.estoque.refresh_from_db()
        self.assertEqual(compra.valor_total, Decimal("0.00"))
        self.assertEqual(compra.despesas.get().valor, Decimal("0.00"))
        self.assertEqual(self.estoque.quantidade_atual, 10)

    def test_excluir_item_compra_entregue_nao_deixa_estoque_negativo(self):
        self.registrar_compra(entregue=True, quantidade=4)
        item = ItemCompra.objects.get()
        self.estoque.quantidade_atual = 2
        self.estoque.save(update_fields=["quantidade_atual"])

        response = self.client.delete(f"/api/itens-compra/{item.pk}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(ItemCompra.objects.filter(pk=item.pk).exists())
        self.estoque.refresh_from_db()
        self.assertEqual(self.estoque.quantidade_atual, 2)
