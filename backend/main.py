from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas
from passlib.context import CryptContext

app = FastAPI(title="CodeVault API")

# Create tables if not already created
models.Base.metadata.create_all(bind=engine)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency: Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "CodeVault API running"}

#
# register function
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # check if first user
    user_count = db.query(models.User).count()
    role = "admin" if user_count == 0 else "user"

    password_str = user.password.strip()[:72]
    hashed_pw = pwd_context.hash(password_str)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role=role  # 👈 assign the role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

