
# Stock Market Dashboard

## Overview
The Stock Market Dashboard is a web application that provides real-time stock market updates, financial news, and portfolio tracking. Built with **Next.js** for the frontend and **FastAPI** for the backend, this project integrates real-time data visualization and user authentication for a seamless trading experience.

## Features
- 📈 **Real-time Stock Data**: Get live updates on stock prices and trends.
- 📰 **Financial News Aggregation**: Fetch the latest market news from various sources.
- 🏦 **Portfolio Tracking**: Monitor your investments in a personalized dashboard.
- 🔒 **Secure Authentication**: JWT-based authentication and role-based access control.
- 📊 **Data Visualization**: Interactive charts and graphs powered by **ShadCN UI**.

## Tech Stack
### Frontend:
- **Next.js** (React framework)
- **TypeScript**
- **ShadCN UI** (for styling and UI components)
- **Lucide React** (icons)
- **Next/Image** (optimized images)

### Backend:
- **FastAPI** (Python-based backend framework)
- **MongoDB** (for data storage)
- **Render** (for deployment)
- **JWT Authentication**

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (local or cloud instance)

### Steps
#### 1️⃣ Clone the Repository
```sh
  git clone https://github.com/yourusername/stock-market-dashboard.git
  cd stock-market-dashboard
```

#### 2️⃣ Install Dependencies
##### Frontend:
```sh
  cd stock-trading-frontend
  npm install
```
##### Backend:
```sh
  cd stock-trading-backend
  pip install -r requirements.txt
```

#### 3️⃣ Configure Environment Variables
Create a `.env` file in both `frontend` and `backend` directories and add necessary API keys and database credentials.

#### 4️⃣ Run the Application
##### Start the Backend:
```sh
  uvicorn main:app --reload
```
##### Start the Frontend:
```sh
  npm run dev
```

## Deployment
The frontend is deployed on **Vercel**, and the backend is hosted on **Render**. To deploy manually:
- Frontend: `vercel --prod`
- Backend: Use Render's web service with the FastAPI configuration.

## Troubleshooting
- If you get an **Invalid src prop** error for images, ensure the image domains are added in `next.config.js`:
```js
  images: {
    domains: ["media.assettype.com", "media.nbcphiladelphia.com", "responsive.fxempire.com"],
  }
```

- If authentication issues arise, check JWT token storage in `localStorage`.

## Contributing
Feel free to open issues or submit pull requests! 🙌

## License
MIT License © 2025 Stock Market Dashboard Team

