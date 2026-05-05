from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('mercadinho', '0008_produto_fornecedor'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='itemvenda',
            name='unique_produto_por_venda',
        ),
        migrations.RemoveConstraint(
            model_name='itemcompra',
            name='unique_produto_por_compra',
        ),
    ]
