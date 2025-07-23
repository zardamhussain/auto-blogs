from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.services.image_service import ImageService, get_image_service

router = APIRouter(
    prefix="/images",
    tags=["Images"],
    responses={404: {"description": "Not found"}},
)

class ImageQuery(BaseModel):
    prompt: str

@router.post("/generate")
async def create_image(query: ImageQuery, image_service: ImageService = Depends(get_image_service)):
    image_url = image_service.generate_image(query.prompt)
    if image_url:
        return {"image_url": image_url}
    else:
        raise HTTPException(status_code=500, detail="Image generation failed") 