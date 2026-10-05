"""kv store"""
revision = "0002"
down_revision = "0001"
import sqlalchemy as sa
from alembic import op

def upgrade():
    op.create_table("kv_store",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_table("kv_store")
