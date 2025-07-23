from uuid import UUID
from ..services.base_data_service import BaseDataService
from ..utils.cache import multidomain_cache
from ..services.cta_service import CTAService
from ..db.conn import get_client
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional

from ..dependencies import get_current_user, get_data_service
from ..models.message import MessageIn, MessageOut, ChatOut
from ..models.user import User
from ..utils.timing import timing_decorator

router = APIRouter(
    prefix="/cta",
    tags=["CTA"],
    responses={404: {"description": "Not found"}},
)

CTA_DOMAIN = "cta"

class Pagination(BaseModel):
    offset: int = Field(0, ge=0)
    limit: int = Field(10, ge=1, le=100)

@router.post("/chat", response_model=MessageOut)
@timing_decorator
async def chat(
    message_in: MessageIn,
    current_user: User = Depends(get_current_user),
    db = Depends(get_client)
):

    hit, handler = multidomain_cache.get(CTA_DOMAIN, current_user.id)

    new_cache_needed = True

    if hit and handler is not None and handler.chat_id == message_in.chat_id: 
        new_cache_needed = False
    else:
        multidomain_cache.invalidate(CTA_DOMAIN, current_user.id)
        handler = CTAService(db, current_user.id, message_in.chat_id)
       
    res = handler.handle_ai_chat(message_in)

    if new_cache_needed:
        multidomain_cache.add(CTA_DOMAIN, current_user.id, handler)
    return res

@router.get("/chats", response_model=List[ChatOut])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    chats = db.get_user_chats(str(current_user.id), offset, limit)
    return chats

@router.get("/chats/{chat_id}/messages", response_model=List[MessageOut])
async def get_messages_for_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: BaseDataService = Depends(get_data_service),
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    messages = db.get_chat_messages(chat_id, offset, limit)

    return messages
