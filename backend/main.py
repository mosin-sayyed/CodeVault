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



# ============================================================
#                   SNIPPET CRUD ROUTES
# ============================================================

# ------------------ ADD SNIPPET ------------------
@app.post("/snippets/add", response_model=schemas.SnippetOut)
def add_snippet(
    snippet: schemas.SnippetCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_snippet = models.Snippet(
        user_id=current_user.id,
        title=snippet.title,
        language=snippet.language,
        description=snippet.description,
        code=snippet.code,
        tags=snippet.tags,
    )
    db.add(new_snippet)
    db.commit()
    db.refresh(new_snippet)

    # compute favorite (always false on creation)
    return {
        **new_snippet.__dict__,
        "is_favorite": False
    }


# ------------------ GET ALL SNIPPETS OF CURRENT USER ------------------
@app.get("/snippets/my", response_model=list[schemas.SnippetOut])
def get_my_snippets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippets = db.query(models.Snippet).filter(
        models.Snippet.user_id == current_user.id
    ).order_by(models.Snippet.created_at.desc()).all()

    results = []
    for s in snippets:
        is_fav = db.query(models.Favorite).filter_by(
            user_id=current_user.id,
            snippet_id=s.id
        ).first() is not None

        results.append({**s.__dict__, "is_favorite": is_fav})

    return results


# ------------------ GET SINGLE SNIPPET ------------------
@app.get("/snippets/{snippet_id}", response_model=schemas.SnippetOut)
def get_snippet(
    snippet_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not s:
        raise HTTPException(status_code=404, detail="Snippet not found")

    is_fav = db.query(models.Favorite).filter_by(
        user_id=current_user.id,
        snippet_id=s.id
    ).first() is not None

    return {**s.__dict__, "is_favorite": is_fav}


# ------------------ UPDATE SNIPPET ------------------
@app.put("/snippets/update/{snippet_id}", response_model=schemas.SnippetOut)
def update_snippet(
    snippet_id: int,
    snippet_data: schemas.SnippetUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    for key, value in snippet_data.dict(exclude_unset=True).items():
        setattr(snippet, key, value)

    db.commit()
    db.refresh(snippet)

    is_fav = db.query(models.Favorite).filter_by(
        user_id=current_user.id,
        snippet_id=snippet_id
    ).first() is not None

    return {**snippet.__dict__, "is_favorite": is_fav}


# ------------------ DELETE SNIPPET ------------------
@app.delete("/snippets/delete/{snippet_id}")
def delete_snippet(
    snippet_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    # Also delete favorites linked to this snippet
    db.query(models.Favorite).filter_by(snippet_id=snippet_id).delete()

    db.delete(snippet)
    db.commit()

    return {"message": "Snippet deleted successfully"}


# ------------------ TOGGLE FAVORITE USING TABLE ------------------
@app.post("/snippets/favorite/{snippet_id}")
def toggle_favorite(
    snippet_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    fav = db.query(models.Favorite).filter_by(
        user_id=current_user.id,
        snippet_id=snippet_id
    ).first()

    if fav:
        # Remove favorite
        db.delete(fav)
        db.commit()
        return {"is_favorite": False}

    # Add favorite
    new_fav = models.Favorite(user_id=current_user.id, snippet_id=snippet_id)
    db.add(new_fav)
    db.commit()

    return {"is_favorite": True}
