from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ Replace "yourpassword" with your actual MySQL password
DATABASE_URL = "mysql+mysqlconnector://root:1234@localhost/codevault_db"


# Create the database engine
engine = create_engine(DATABASE_URL)

# Session for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()
