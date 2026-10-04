from alembic import context
from app.models import Base, engine
target_metadata = Base.metadata
def run_migrations_online():
    with engine.connect() as c:
        context.configure(connection=c, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
run_migrations_online()
