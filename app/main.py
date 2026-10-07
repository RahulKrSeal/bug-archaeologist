# # app/ Backend application
# # main.py Starts FastAPI and registers routes

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import text
# from app.core.config import settings
# from app.database import engine
# from app.auth.router import router as auth_router

# app = FastAPI(
#     title=settings.APP_NAME
# ) # creates FastAPI application

# # Allow the local frontend to communicate with FastAPI.
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "null",
#         "http://127.0.0.1:5500",
#         "http://localhost:5500",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/") # /creates /GET
# def home():
#     with engine.connect() as connection:
#         connection.execute(text("SELECT 1"))

#     return {
#         "app_name": settings.APP_NAME,
#         "database": "connected"
#     }   # response

# # Register authentication routes
# app.include_router(auth_router)
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text

from app.auth.router import router as auth_router
from app.core.config import settings
from app.database import engine


app = FastAPI(title=settings.APP_NAME)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@app.get("/")
def home():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "app_name": settings.APP_NAME,
        "database": "connected",
    }


@app.get("/login")
def login_page():
    return FileResponse(
        FRONTEND_DIR / "login.html"
    )


@app.get("/verify")
def verification_page():
    return FileResponse(
        FRONTEND_DIR / "verify.html"
    )


app.include_router(auth_router)