
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import NewsCreate, NewsInDB, NewsUpdate
from app.crud import create_news, get_news, get_news_by_id
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import News, User, UserRole
from app.logging_config import logger

router = APIRouter(prefix="/news", tags=["news"])

"""GET"""
@router.get("/", response_model=List[NewsInDB])
def read_news(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    news = get_news(db, skip, limit)
    return news

@router.get("/{news_id}", response_model=NewsInDB)
def read_news_by_id(news_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    news = get_news_by_id(db, news_id)
    if not news or not news.is_active:
        raise HTTPException(status_code=404, detail="News not found")
    return news

"""POST"""
@router.post("/", response_model=NewsInDB)
def create_news_endpoint(news: NewsCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    logger.info(f"Admin {current_user.email_corporate} creating news with title: {news.title}")
    return create_news(db, news, current_user.id)

"""PUT/PATCH"""
@router.patch("/{news_id}", response_model=NewsInDB)
def update_news(
    news_id: int,
    news_update: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_news = get_news_by_id(db, news_id)
    if not db_news:
        raise HTTPException(status_code=404, detail="News not found")
    if db_news.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own news")
    
    if news_update.title is not None:
        db_news.title = news_update.title
    if news_update.content is not None:
        db_news.content = news_update.content
    if news_update.is_active is not None:
        db_news.is_active = news_update.is_active
    
    db.commit()
    db.refresh(db_news)
    return db_news

"""DELETE"""
@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_news = get_news_by_id(db, news_id)
    if not db_news:
        raise HTTPException(status_code=404, detail="News not found")
    if db_news.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own news")
    
    db_news.is_active = False
    db.commit()
    return None