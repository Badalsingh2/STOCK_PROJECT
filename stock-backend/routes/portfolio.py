from fastapi import APIRouter, Depends, HTTPException
from auth import decode_access_token, oauth2_scheme
from database import users_collection
from bson import ObjectId
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

STOCK_API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://finnhub.io/api/v1"

# Helper function to fetch stock logo
def fetch_stock_logo(symbol):
    try:
        response = requests.get(f"{BASE_URL}/stock/profile2?symbol={symbol}&token={STOCK_API_KEY}")
        if response.status_code == 200:
            return response.json().get("logo", None)
    except requests.exceptions.RequestException:
        return None

from pydantic import BaseModel

class StockRequest(BaseModel):
    symbol: str
    quantity: int

# @router.post("/add")
# async def add_to_portfolio(stock: StockRequest, token: str = Depends(oauth2_scheme)):
#     user_data = decode_access_token(token)
#     if not user_data:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     logo_url = fetch_stock_logo(stock.symbol)

#     user_id = ObjectId(user_data["user_id"])
#     await users_collection.update_one(
#         {"_id": user_id},
#         {"$push": {"portfolio": {"symbol": stock.symbol, "quantity": stock.quantity, "logo": logo_url}}}
#     )

#     return {"message": "Stock added to portfolio", "logo": logo_url}

# ✅ 2️⃣ View user portfolio (Includes Logo)
@router.get("/")
async def get_portfolio(token: str = Depends(oauth2_scheme)):
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = ObjectId(user_data["user_id"])
    user = await users_collection.find_one({"_id": user_id}, {"portfolio": 1, "_id": 0})

    if not user or "portfolio" not in user:
        raise HTTPException(status_code=404, detail="Portfolio is empty")

    return {"portfolio": user["portfolio"]}

# ✅ 3️⃣ Remove a stock from portfolio
# @router.delete("/remove")
# async def remove_from_portfolio(symbol: str, token: str = Depends(oauth2_scheme)):
#     user_data = decode_access_token(token)
#     if not user_data:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     user_id = ObjectId(user_data["user_id"])
#     update_result = await users_collection.update_one(
#         {"_id": user_id},
#         {"$pull": {"portfolio": {"symbol": symbol}}}
#     )

#     if update_result.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Stock not found in portfolio")

#     return {"message": "Stock removed from portfolio"}

# ✅ 4️⃣ Update stock quantity
@router.put("/update")
async def update_portfolio(symbol: str, quantity: int, token: str = Depends(oauth2_scheme)):
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = ObjectId(user_data["user_id"])
    update_result = await users_collection.update_one(
        {"_id": user_id, "portfolio.symbol": symbol},
        {"$set": {"portfolio.$.quantity": quantity}}
    )

    if update_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Stock not found in portfolio")

    return {"message": "Stock quantity updated"}

# ✅ 5️⃣ Get real-time stock value in portfolio (Includes Logo)
@router.get("/value")
async def get_portfolio_value(token: str = Depends(oauth2_scheme)):
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = ObjectId(user_data["user_id"])
    user = await users_collection.find_one({"_id": user_id}, {"portfolio": 1, "_id": 0})

    if not user or "portfolio" not in user:
        raise HTTPException(status_code=404, detail="Portfolio is empty")

    portfolio = user["portfolio"]
    total_value = 0
    stock_values = []

    for stock in portfolio:
        symbol = stock["symbol"]
        quantity = stock["quantity"]
        logo = stock.get("logo", None)

        # Fetch stock price
        try:
            response = requests.get(f"{BASE_URL}/quote?symbol={symbol}&token={STOCK_API_KEY}")
            if response.status_code == 200:
                data = response.json()
                stock_price = data.get("c", 0)  # 'c' is the current price

                if stock_price:
                    total_stock_value = stock_price * quantity
                    total_value += total_stock_value
                    stock_values.append({
                        "symbol": symbol,
                        "quantity": quantity,
                        "price": stock_price,
                        "total_value": total_stock_value,
                        "logo": logo
                    })
        except requests.exceptions.RequestException:
            continue

    return {"total_portfolio_value": total_value, "stocks": stock_values}
