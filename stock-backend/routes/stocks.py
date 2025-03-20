from fastapi import APIRouter, HTTPException, Depends, Query
import os
import httpx
from dotenv import load_dotenv
from database import stock_symbols_collection
from pymongo import UpdateOne
import requests
import yfinance as yf
from auth import oauth2_scheme

load_dotenv()

router = APIRouter()

STOCK_API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://finnhub.io/api/v1"

@router.get("/{symbol}")
async def get_stock(symbol: str):
    """Fetch real-time stock data asynchronously."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/quote?symbol={symbol}&token={STOCK_API_KEY}")

    if response.status_code == 200:
        return response.json()
    
    raise HTTPException(status_code=404, detail="Stock not found")


@router.get("/symbols/update")
async def fetch_and_store_stock_symbols(exchange: str = "US"):
    """Fetch stock symbols from Finnhub, fetch their logos, and store only up to 100 entries in MongoDB."""
    response = requests.get(f"{BASE_URL}/stock/symbol?exchange={exchange}&token={STOCK_API_KEY}")

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch stock symbols")

    stock_symbols = response.json()

    if not stock_symbols:
        raise HTTPException(status_code=404, detail="No stock symbols found")

    # Limit to 100 entries
    stock_symbols = stock_symbols[:100]

    # Optional: Clear existing data to ensure only the latest 100 are stored
    stock_symbols_collection.delete_many({"exchange": exchange})

    bulk_operations = []
    
    for stock in stock_symbols:
        symbol = stock["symbol"]

        # Fetch company profile to get logo URL
        profile_response = requests.get(f"{BASE_URL}/stock/profile2?symbol={symbol}&token={STOCK_API_KEY}")
        logo_url = None
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            logo_url = profile_data.get("logo", None)  # Get logo if available

        # Add logo URL to stock data
        stock["logo"] = logo_url

        # Prepare bulk update
        bulk_operations.append(
            UpdateOne(
                {"symbol": symbol, "exchange": exchange},  # Match existing entry
                {"$set": stock},  # Update fields
                upsert=True  # Insert if not found
            )
        )

    if bulk_operations:
        stock_symbols_collection.bulk_write(bulk_operations)

    return {"message": "Stock symbols updated successfully with logos", "count": len(stock_symbols)}



@router.get("/get/symbols")
async def get_stock_symbols(exchange: str = "US"):
    """Retrieve only up to 100 stored stock symbols from MongoDB asynchronously, with optimized fields."""
    
    # Ensure index on `exchange` for faster lookups
    await stock_symbols_collection.create_index([("exchange", 1)])

    # Fetch only necessary fields
    symbols = await stock_symbols_collection.find(
        {"exchange": exchange}, 
        {"_id": 0, "symbol": 1, "exchange": 1, "description": 1, "type": 1}  # Fetch only required fields
    ).limit(100).batch_size(20).to_list(None)

    if not symbols:
        raise HTTPException(status_code=404, detail="Stock symbols not found, update first.")

    return symbols


@router.get("/get/history")
async def get_stock_history(symbol: str, token: str = Depends(oauth2_scheme)):
    """Fetch historical stock data from Yahoo Finance."""
    if not symbol:
        raise HTTPException(status_code=400, detail="Stock symbol is required.")

    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1mo")  # Fetch last 1 month
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No stock data found. Try a different symbol.")
        
        chart_data = [
            {"date": date.strftime("%Y-%m-%d"), "close": close}
            for date, close in zip(hist.index, hist["Close"])
        ]

        return {"data": chart_data}

    except Exception as e:
        print(f"Error fetching stock data: {str(e)}")  # Debugging
        raise HTTPException(status_code=400, detail=f"Error fetching data: {str(e)}")
    


@router.get("/get/search")
async def search_stocks(query: str = Query(..., min_length=2)):
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raises HTTPError for bad responses
        
        # Ensure the data structure is as expected
        data = response.json()

        # Check if 'quotes' exists and is a list
        if "quotes" not in data or not isinstance(data["quotes"], list):
            raise ValueError("Unexpected data structure received from Yahoo Finance API")

        results = [
            {
                "symbol": item.get("symbol", "N/A"),
                "name": item.get("longname", item.get("shortname", "N/A")),  # Prefer longname, fallback to shortname
                "exchange": item.get("exchDisp", "N/A")  # Display exchange information
            }
            for item in data["quotes"]
            if item.get("quoteType") == "EQUITY"  # Ensure the result is an EQUITY
        ]

        return {"results": results}
    
    except requests.exceptions.RequestException as req_err:
        raise HTTPException(status_code=500, detail=f"Request error: {str(req_err)}")
    except ValueError as val_err:
        raise HTTPException(status_code=500, detail=f"Value error: {str(val_err)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")