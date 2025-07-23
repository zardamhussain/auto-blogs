from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict
from ..dependencies import get_project_id

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    responses={404: {"description": "Not found"}},
)

class AnalyticsSummary(BaseModel):
    posts_created: int
    words_generated: int
    images_created: int

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(project_id: str = Depends(get_project_id)):
    # Placeholder for analytics summary
    return {"posts_created": 15, "words_generated": 25000, "images_created": 30}

@router.get("/usage-over-time")
async def get_usage_over_time(project_id: str = Depends(get_project_id)):
    # Placeholder for time-series usage data
    return {
        "dates": ["2023-10-01", "2023-10-02", "2023-10-03"],
        "posts_created": [5, 3, 7],
    }
