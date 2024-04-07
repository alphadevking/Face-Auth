from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()

# # Adjust the database URL and engine according to your actual database
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/mydatabase"

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This line is commented to prevent interruptions using Alembic Migrations, if you are not using Alembic, then uncomment this to run SQL directly.
# Base.metadata.create_all(bind=engine)
