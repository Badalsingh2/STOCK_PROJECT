from fastapi_socketio import SocketManager
from fastapi import FastAPI
import requests
import os
import asyncio

app = FastAPI()
socket_manager = SocketManager(app)
STOCK_API_KEY = os.getenv("STOCK_API_KEY")

async def fetch_stock(symbol):
    response = requests.get(f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={STOCK_API_KEY}")
    return response.json()

@socket_manager.on("subscribe_stock")
async def subscribe_stock(sid, data):
    symbol = data["symbol"]
    while True:
        stock_data = await fetch_stock(symbol)
        await socket_manager.emit("stock_update", stock_data, room=sid)
        await asyncio.sleep(10)
