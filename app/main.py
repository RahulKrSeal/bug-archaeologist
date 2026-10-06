# app/ Backend application
# main.py Starts FastAPI and registers routes

from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings
from app.database import engine

app = FastAPI() # creates FastAPI application

@app.get("/") # /creates /GET
def home():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "app_name": settings.APP_NAME,
        "database": "connected"
    }   # response
