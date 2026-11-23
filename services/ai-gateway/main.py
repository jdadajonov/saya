"""AI Gateway — Stage 2 placeholder. Currently returns empty stubs."""
from fastapi import FastAPI

app = FastAPI(title="Saya AI Gateway", version="0.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "stage": "placeholder"}
