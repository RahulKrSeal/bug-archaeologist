# app/ Backend application
# main.py Starts FastAPI and registers routes

from fastapi import FastAPI
from app.core.config import settings 

app = FastAPI() # creates FastAPI application

@app.get("/") # /creates /GET
def home():
    return {"app_name": settings.APP_NAME} # response

