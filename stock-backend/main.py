from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
import logging
import random
import asyncio
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from routes import users, stocks, portfolio, trading

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stock API configuration
STOCK_API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://finnhub.io/api/v1/quote"
# Include routers
app.include_router(users.router, prefix="/users")
app.include_router(stocks.router, prefix="/stocks")
app.include_router(portfolio.router, prefix="/portfolio")
app.include_router(trading.router, prefix="/trading")
# Initialize thread executor for blocking I/O operations
executor = ThreadPoolExecutor()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store connected WebSockets
connected_clients = {}

def fetch_stock_price(symbol: str):
    """Fetch real-time stock price from Finnhub API (synchronous request)."""
    url = f"{BASE_URL}?symbol={symbol}&token={STOCK_API_KEY}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data.get("c")  # Current stock price
        logger.warning(f"Failed to fetch stock price: {response.status_code}")
        return None
    except Exception as e:
        logger.error(f"Error fetching stock price: {str(e)}")
        return None

def generate_market_movers():
    """Generate market movers with realistic price fluctuations."""
    symbols = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
        {"symbol": "META", "name": "Meta Platforms Inc."},
        {"symbol": "PYPL", "name": "PayPal Holdings Inc."},
    ]

    movers = []
    for stock in symbols:
        base_price = 100 + random.random() * 500
        fluctuation = random.uniform(-3.5, 3.5)
        price = round(base_price + fluctuation, 2)
        change = round(fluctuation / base_price * 100, 2)

        movers.append({
            "symbol": stock["symbol"],
            "name": stock["name"],
            "price": price,
            "change": change,
            "isUp": change >= 0
        })

    return sorted(movers, key=lambda x: abs(x["change"]), reverse=True)[:5]

async def stock_data_emitter():
    """Send updates for each client's selected stock"""
    logger.info("Starting stock data emitter")
    
    while True:
        if connected_clients:
            try:
                # Process each client's selected symbol
                for websocket, symbol in list(connected_clients.items()):
                    loop = asyncio.get_event_loop()
                    price = await loop.run_in_executor(executor, fetch_stock_price, symbol)
                    
                    if price is None:
                        price = 150 + random.random() * 10
                    
                    update_data = {
                        "symbol": symbol,
                        "price": round(price, 2),
                        "time": datetime.now().isoformat()
                    }

                    try:
                        await websocket.send_json({
                            "event": "stock_update",
                            "data": update_data
                        })
                    except:
                        del connected_clients[websocket]

                # Send market movers to everyone
                movers = generate_market_movers()
                for websocket in connected_clients:
                    await websocket.send_json({"event": "market_movers", "data": movers})

            except Exception as e:
                logger.error(f"Emitter error: {str(e)}")
        
        await asyncio.sleep(2)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Initialize with default symbol
    connected_clients[websocket] = "AAPL"
    logger.info(f"New connection: {websocket.client} watching AAPL")

    try:
        while True:
            symbol = await websocket.receive_text()
            if symbol in ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META"]:
                connected_clients[websocket] = symbol
                logger.info(f"{websocket.client} switched to {symbol}")
    except WebSocketDisconnect:
        logger.info(f"Disconnected: {websocket.client}")
        del connected_clients[websocket]

@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup."""
    asyncio.create_task(stock_data_emitter())

@app.get("/")
def read_root():
    return {"message": "Stock Trading Platform API", "status": "running"}
