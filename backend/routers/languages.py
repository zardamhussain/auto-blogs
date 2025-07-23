from fastapi import APIRouter, Depends
from typing import List
from ..models.supported_language import SupportedLanguage
from ..services.base_data_service import BaseDataService
from ..dependencies import get_data_service
from ..utils.cache import multidomain_cache

router = APIRouter(
    prefix="/languages",
    tags=["Languages"]
)

LANGUAGE_DOMAIN = "languages"

@router.get("/supported", response_model=List[SupportedLanguage])
def list_supported_languages(
    db_service: BaseDataService = Depends(get_data_service)
):
    """
    Returns a list of all currently active supported languages.
    """
    cache_key = "supported"
    hit, cached = multidomain_cache.get(LANGUAGE_DOMAIN, cache_key)
    if hit:
        return cached
    try:
        languages_data = db_service.get_supported_languages()
        result = [SupportedLanguage(**lang) for lang in languages_data]
        multidomain_cache.add(LANGUAGE_DOMAIN, cache_key, result)
        return result
    except Exception as e:
        print(f"Error fetching supported languages: {e}")
        return [] 