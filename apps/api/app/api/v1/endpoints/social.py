from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.session import get_db
from app.models.social import Community, CommunityMember, SocialPost
from app.models.user import User
from app.schemas import SocialPostCreate, SocialPostOut

router = APIRouter(prefix="/social", tags=["social"])


class CommunityCreate(BaseModel):
    name: str
    description: str | None = None
    technologies: list[str] = []
    is_private: bool = False


@router.post("/posts", response_model=SocialPostOut, status_code=201)
async def create_post(
    data: SocialPostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("social:write"))],
) -> SocialPost:
    post = SocialPost(
        author_id=user.id,
        community_id=data.community_id,
        post_type=data.post_type,
        title=data.title,
        body=data.body,
        technologies=data.technologies,
        media_urls=data.media_urls,
    )
    db.add(post)
    await db.flush()
    return post


@router.get("/posts", response_model=list[SocialPostOut])
async def feed(db: Annotated[AsyncSession, Depends(get_db)], limit: int = 50) -> list[SocialPost]:
    rows = (
        await db.execute(
            select(SocialPost)
            .where(SocialPost.is_hidden.is_(False))
            .order_by(SocialPost.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    return list(rows)


@router.post("/communities", response_model=dict, status_code=201)
async def create_community(
    data: CommunityCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("social:write"))],
) -> dict:
    community = Community(
        name=data.name,
        slug=slugify(data.name),
        description=data.description,
        owner_id=user.id,
        technologies=data.technologies,
        is_private=data.is_private,
        member_count=1,
    )
    db.add(community)
    await db.flush()
    db.add(CommunityMember(community_id=community.id, user_id=user.id, role="admin"))
    return {"id": str(community.id), "slug": community.slug, "name": community.name}


@router.post("/communities/{community_id}/join", response_model=dict)
async def join_community(
    community_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    community = (
        await db.execute(select(Community).where(Community.id == community_id))
    ).scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    existing = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return {"status": "already_member"}
    db.add(CommunityMember(community_id=community_id, user_id=user.id))
    community.member_count += 1
    return {"status": "joined"}
