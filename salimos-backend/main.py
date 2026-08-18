from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

API_HOST = "cli-api-service.fourvenues.com"
API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJjbGktYXBpLXNlcnZpY2UiLCJpYXQiOjE3ODY5MDQ5MzR9.gagE3yvxbOaER_dbY8JFrAaFSAJrxwVDWeOg_aXPsS8"
PORT = int(os.getenv("PORT", "8082"))

app = FastAPI(title="Salimos Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "message": "NightSpot Proxy API is running",
        "endpoints": ["/api/microsites/{slug}/metadata", "/api/health"],
        "status": "ok",
    }


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "message": "Proxy API is running",
        "timestamp": "ok",
        "version": "1.0.0",
    }


@app.api_route("/api/microsites/{slug}/metadata", methods=["GET", "OPTIONS"])
async def proxy_metadata(request: Request, slug: str) -> JSONResponse:
    if request.method == "OPTIONS":
        return JSONResponse(status_code=204, content=None)

    url = f"https://{API_HOST}/api/microsites/{slug}/metadata"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {API_TOKEN}",
                    "Content-Type": "application/json",
                },
                timeout=20.0,
            )

        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return JSONResponse(status_code=response.status_code, content=response.json())
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(status_code=502, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
