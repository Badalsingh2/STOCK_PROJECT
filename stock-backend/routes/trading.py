from fastapi import APIRouter, Depends, HTTPException, Query
from auth import decode_access_token, oauth2_scheme
from database import users_collection
from bson import ObjectId
import requests
import os
import time
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
import httpx
from datetime import datetime
from dateutil import parser

load_dotenv()

router = APIRouter()

STOCK_API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://finnhub.io/api/v1"

class StockRequest(BaseModel):
    symbol: str
    quantity: int



# ✅ Simulated Buy/Sell Trading with Trade History
@router.post("/trade")
async def trade_stock(stock: StockRequest, action: str = Query(..., description="buy/sell"), token: str = Depends(oauth2_scheme)):
    """Buy/Sell stocks with proper quantity aggregation"""
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    if action.lower() not in ["buy", "sell"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'buy' or 'sell'.")

    user_id = ObjectId(user_data["user_id"])
    user = await users_collection.find_one({"_id": user_id}, {"portfolio": 1, "trade_history": 1, "_id": 0})
    timestamp = datetime.utcnow().isoformat()

    if action.lower() == "buy":
        # ✅ Updated Buy Logic
        await users_collection.update_one(
            {"_id": user_id},
            [
                {
                    "$set": {
                        "portfolio": {
                            "$cond": [
                                {
                                    "$in": [
                                        stock.symbol,
                                        {"$ifNull": ["$portfolio.symbol", []]}  # Ensure it's an array
                                    ]
                                },
                                {
                                    "$map": {
                                        "input": {"$ifNull": ["$portfolio", []]},  # Ensure portfolio is an array
                                        "as": "item",
                                        "in": {
                                            "$cond": [
                                                {"$eq": ["$$item.symbol", stock.symbol]},
                                                {
                                                    "symbol": "$$item.symbol",
                                                    "quantity": {"$add": ["$$item.quantity", stock.quantity]}
                                                },
                                                "$$item"
                                            ]
                                        }
                                    }
                                },
                                {
                                    "$concatArrays": [
                                        {"$ifNull": ["$portfolio", []]},  # Ensure portfolio is an array
                                        [{"symbol": stock.symbol, "quantity": stock.quantity}]
                                    ]
                                }
                            ]
                        }
                    }
                }
            ]
        )


        # Log trade history
        await users_collection.update_one(
            {"_id": user_id},
            {"$push": {"trade_history": {
                "action": "buy",
                "symbol": stock.symbol,
                "quantity": stock.quantity,
                "timestamp": timestamp
            }}}
        )

        return {"message": f"Bought {stock.quantity} of {stock.symbol}"}

    elif action.lower() == "sell":
        if not user or "portfolio" not in user:
            raise HTTPException(status_code=404, detail="Portfolio is empty")

        # Find aggregated stock entry
        stock_entry = next(
            (item for item in user["portfolio"] if item["symbol"] == stock.symbol),
            None
        )

        if not stock_entry:
            raise HTTPException(status_code=400, detail="Stock not found in portfolio")

        if stock_entry["quantity"] < stock.quantity:
            raise HTTPException(status_code=400, 
                detail=f"Not enough shares. You have {stock_entry['quantity']} of {stock.symbol}")

        new_quantity = stock_entry["quantity"] - stock.quantity

        # Update portfolio
        if new_quantity == 0:
            await users_collection.update_one(
                {"_id": user_id},
                {"$pull": {"portfolio": {"symbol": stock.symbol}}}
            )
        else:
            await users_collection.update_one(
                {"_id": user_id, "portfolio.symbol": stock.symbol},
                {"$set": {"portfolio.$.quantity": new_quantity}}
            )

        # Log trade history
        await users_collection.update_one(
            {"_id": user_id},
            {"$push": {"trade_history": {
                "action": "sell",
                "symbol": stock.symbol,
                "quantity": stock.quantity,
                "timestamp": timestamp
            }}}
        )

        return {"message": f"Sold {stock.quantity} of {stock.symbol}"}
        
        
# ✅ Get Trade History
@router.get("/trade/history")
async def get_trade_history(token: str = Depends(oauth2_scheme)):
    """Fetch user's trade history."""
    user_data = decode_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = ObjectId(user_data["user_id"])
    user = await users_collection.find_one({"_id": user_id}, {"trade_history": 1, "_id": 0})

    if not user or "trade_history" not in user:
        return {"trade_history": []}

    return {"trade_history": user["trade_history"]}

# ✅ 3️⃣ Get Trending Stocks
@router.get("/trending")
async def get_trending_stocks(token: str = Depends(oauth2_scheme)):
    """Fetch trending stocks from Finnhub."""
    url = f"{BASE_URL}/stock/symbol?exchange=US&token={STOCK_API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        stock_data = response.json()
        trending_stocks = [stock["symbol"] for stock in stock_data[:10]]
        return {"trending_stocks": trending_stocks}

    raise HTTPException(status_code=400, detail="Failed to fetch trending stocks")


NEWS_API = os.getenv("NEWSDATA_API_KEY")

class NewsArticle(BaseModel):
    title: str
    link: str
    description: str  # Ensuring it's always a string
    pubDate: datetime
    source: str
    image_url: Optional[str] = None

def sanitize_description(desc) -> str:
    """Ensure description is always a valid non-empty string"""
    if isinstance(desc, str) and desc.strip():
        return desc.strip()
    return "No description available"

@router.get("/api/news", response_model=List[NewsArticle])
async def get_news(symbols: str = Query(..., description="Comma-separated stock symbols")):
    symbols_list = symbols.split(',')

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://newsdata.io/api/1/news",
                params={
                    "apikey": NEWS_API,
                    "qInTitle": ",".join(symbols_list),
                    "language": "en",
                    "category": "business"
                }
            )
            response.raise_for_status()
            news_data = response.json()

            articles = []
            for article in news_data.get("results", []):
                # ✅ Ensure description is a string before passing to Pydantic
                clean_description = sanitize_description(article.get("description"))

                try:
                    articles.append(NewsArticle(
                        title=str(article.get("title", "No Title Available")),  # Ensure title is a string
                        link=str(article.get("link", "#")),  # Ensure link is a string
                        description=clean_description,  # Now always a valid string
                        pubDate=datetime.fromisoformat(article["pubDate"]),
                        source=str(article.get("source_id", "Unknown")),  # Ensure source is a string
                        image_url=article.get("image_url")
                    ))
                except Exception as e:
                    print(f"⚠️ Skipping invalid article: {e}")  # Log error but don't crash

            return articles

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"News API error: {str(e)}")
    except KeyError as e:
        raise HTTPException(status_code=502, detail=f"Missing expected field in API response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process news: {str(e)}")
