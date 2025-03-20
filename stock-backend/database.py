from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Check your .env file.")

try:
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)  # 5s timeout
    db = client.stock_market
    users_collection = db["users"]
    transactions_collection = db["transactions"]
    stocks_collection = db["stocks"]
    stock_symbols_collection = db["stock_symbols"]  # NEW: Collection for stock symbols
except Exception as e:
    raise RuntimeError(f"Error connecting to MongoDB: {str(e)}")

async def close_mongo_connection():
    """Gracefully close the MongoDB connection."""
    client.close()
