from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import users_collection
from auth import hash_password, verify_password, create_access_token, oauth2_scheme, decode_access_token
from bson import ObjectId

router = APIRouter()

# Pydantic models for request validation
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register_user(user: UserRegister):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pwd = hash_password(user.password)
    new_user = {"username": user.username, "email": user.email, "password": hashed_pwd}
    result = await users_collection.insert_one(new_user)

    return {"message": "User registered successfully", "id": str(result.inserted_id)}

@router.post("/login")
async def login_user(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"user_id": str(db_user["_id"]), "email": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/user/me")
async def get_user_profile(token: str = Depends(oauth2_scheme)):
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users_collection.find_one({"_id": ObjectId(user_data["user_id"])}, {"password": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert MongoDB `_id` to string for JSON serialization
    user["_id"] = str(user["_id"])

    return user
