from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from database import SessionLocal, engine
import models, schemas
from passlib.context import CryptContext
from auth import authenticate_user, create_access_token, get_current_user, get_db

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from fastapi import Depends

app = FastAPI(title="CodeVault API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # during dev, allow all; later, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# ------------------ HOME ROUTE ------------------
@app.get("/")
def home():
    return {"message": "CodeVault API running"}


# ------------------ REGISTER ROUTE ------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Check if first user → make admin
    user_count = db.query(models.User).count()
    role = "admin" if user_count == 0 else "user"

    password_str = user.password.strip()[:72]
    hashed_pw = pwd_context.hash(password_str)

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ------------------ LOGIN ROUTE ------------------
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Using email as username field in Swagger login form
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
    }


# ------------------ PROTECTED ROUTE ------------------
@app.get("/me")
def read_users_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
    }

@app.get("/admin/data")
def admin_data(
    current_user=Depends(get_current_user)
):
    # Check role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    return {"message": "This is admin data"}



# ------------------ ADMIN: GET ALL USERS ------------------
@app.get("/admin/users")
def get_all_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Only admin allowed
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access Forbidden: Admin Only")

    users = db.query(models.User).all()
    return users


# ------------------ ADMIN: DELETE A USER ------------------
@app.delete("/admin/delete/{user_id}")
def delete_user(user_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only!")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Admin cannot delete himself
    if user.id == current_user.id:
        raise HTTPException(status_code=403, detail="You cannot delete yourself.")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# ------------------ ADMIN: ADD A USER (OPTIONAL) ------------------
@app.post("/admin/add")
def admin_add_user(user: schemas.UserCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only!")

    # Check if exists
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username/Email already exists")

    hashed_pw = pwd_context.hash(user.password.strip()[:72])

    # new user is always normal user (role=user)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User added successfully", "user": new_user}