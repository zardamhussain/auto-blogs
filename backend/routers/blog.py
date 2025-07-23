from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from ..dependencies import get_data_service, get_current_user, get_sanity_service
from typing import Any, Dict, List
from uuid import UUID
from backend.services.base_data_service import BaseDataService
from backend.models.blog_post import BlogPost
from backend.models.user import User
from backend.services.sanity_service import SanityService
from backend.utils.slugify import slugify
import frontmatter
from backend.utils.timing import timing_decorator

class StatusUpdate(BaseModel):
    status: str

from ..utils.cache import multidomain_cache

router = APIRouter(
    prefix="/blogs",
    tags=["Blogs"],
    responses={404: {"description": "Not found"}},
)


BLOG_DOMAIN = "blogs"

@router.get("/posts/{project_id}", response_model=List[Dict[str, Any]])
@timing_decorator
async def get_blogs_for_project(
    project_id: UUID,
    db: BaseDataService = Depends(get_data_service)
):
    """
    Get a list of blog posts for a given project ID.
    """
    try:
        hit, val = multidomain_cache.get(BLOG_DOMAIN, project_id)
        if hit and val is not None:
            return val
        
        posts = db.get_blog_posts_by_project_id(str(project_id))
        multidomain_cache.add(BLOG_DOMAIN, project_id, posts)
        return posts
    except Exception as e:
        # This is a general catch-all. For production, you might want more specific
        # error handling based on the types of exceptions `get_blog_posts_by_project_id` can raise.
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts/post/{post_id}", response_model=Dict[str, Any])
async def get_blog_post_by_id(
    post_id: UUID,
    db: BaseDataService = Depends(get_data_service)
):
    """
    Get a single blog post by its ID, including translations.
    """
    try:
        post = db.get_blog_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        return post
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/slug/{slug}", response_model=Dict[str, Any])
async def get_blog_post_by_slug(
    slug: str,
    db: BaseDataService = Depends(get_data_service)
):
    """
    Get a single blog post by its slug.
    """
    try:
        post = db.get_blog_post_by_slug(slug)
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        return post
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/posts/{post_id}", response_model=Dict[str, Any])
@timing_decorator
async def get_project_blog_post(
    project_id: UUID,
    post_id: UUID,
    db: BaseDataService = Depends(get_data_service)
):
    """
    Get a single blog post for a given project, parsing its markdown content.
    """
    print(f"--- BACKEND: Received request for post ID: {post_id} in project ID: {project_id} ---")
    try:
        # First, validate the post belongs to the project.
        key = f"post_{post_id}"
        hit, val = multidomain_cache.get(BLOG_DOMAIN, key)
        if hit and val is not None:
            return val

        post = db.get_blog_post_by_id(post_id) # This should be efficient if indexed
        if not post or str(post['project_id']) != str(project_id):
            print(f"--- BACKEND: Post ID {post_id} NOT FOUND in project {project_id}. ---")
            raise HTTPException(status_code=404, detail="Blog post not found in this project.")

        # Re-using the logic from the publishing endpoint to parse markdown
        if not post.get('content'):
            return {
                "metadata": {"title": post.get('title', 'Untitled')},
                "content": "This post has no content.",
                "raw_post": post
            }

        parsed_post = frontmatter.loads(post['content'])
        post_content = parsed_post.content
        frontmatter_metadata = parsed_post.metadata

        print(f"--- BACKEND: Successfully found and returning post {post_id}. ---")
        result = {
            "metadata": frontmatter_metadata,
            "content": post_content,
            "raw_post": post # includes original title, status, dates etc.
        }

        multidomain_cache.add(BLOG_DOMAIN, key, result)

        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"--- BACKEND: An unexpected error occurred while fetching post {post_id}: {str(e)} ---")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/projects/{project_id}/lang/{language_code}/slug/{slug}", response_model=Dict[str, Any])
async def get_blog_post_by_slug_and_language(
    project_id: UUID,
    slug: str,
    language_code: str = 'en',
    db: BaseDataService = Depends(get_data_service)
):
    """
    Get a blog post by project_id, slug, and language_code.
    Returns the blog post and the translation for the given language.
    Matches the structure of the get_project_blog_post endpoint.
    """
    try:
        # Caching logic
        key = f"slug_{project_id}_{slug}_{language_code}"
        hit, val = multidomain_cache.get(BLOG_DOMAIN, key)
        if hit and val is not None:
            return val
        # Find the blog post by project_id and slug
        posts = db.get_blog_posts_by_project_id(str(project_id))
        post = next((p for p in posts if p.get("slug") == slug), None)
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found for this slug in the project.")
        # Find the translation for the requested language
        if 'en' != language_code:
            translations = post.get("translations", [])
            translation = next((t for t in translations if t.get("language_code") == language_code), None)
        else:
            translation = post
        if not translation:
            raise HTTPException(status_code=404, detail="Translation not found for this language.")
        # Parse markdown frontmatter/content for the translation
        content = translation.get("content", "")
        if content:
            parsed_post = frontmatter.loads(content)
            post_content = parsed_post.content
            frontmatter_metadata = parsed_post.metadata
        else:
            post_content = "This post has no content."
            frontmatter_metadata = {"title": translation.get("title", "Untitled")}
        result = {
            "metadata": frontmatter_metadata,
            "content": post_content,
            "raw_post": translation
        }
        multidomain_cache.add(BLOG_DOMAIN, key, result)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: UUID,
    db: BaseDataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivates a blog post by setting its is_active flag to False.
    The user must have permission to modify the post.
    """

    post = db.get_blog_post(str(post_id), str(current_user.id))

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found or user does not have permission to modify it."
        ) 

    project = db.get_project_by_id(UUID(post.project_id))
    if not project:
        raise HTTPException(status_code=500, detail="Could not verify project for the post.")

    is_owner = project.owner_id == current_user.id
    has_permission = is_owner

    if not has_permission:
        member = db.get_project_member_by_user_id(project_id=UUID(post.project_id), user_id=current_user.id)
        if member and 'write' in member.permissions:
            has_permission = True

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this post."
        )

    success = db.deactivate_blog_post(post_id=str(post_id), user_id=str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate blog post."
        )
        
    multidomain_cache.invalidate(BLOG_DOMAIN, post.project_id)
    return

@router.put("/posts/{post_id}/status")
async def update_blog_post_status(
    post_id: UUID,
    status_update: StatusUpdate,
    db: BaseDataService = Depends(get_data_service),
    sanity_service: SanityService = Depends(get_sanity_service),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the status of a blog post. If the new status is "Published",
    the post is also created or updated in Sanity.
    """
    # First, update the status in our local database
    updated_post = db.update_blog_post_status(post_id=str(post_id), status=status_update.status)
    if not updated_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found."
        )
    print(f"Updated post: {updated_post}")

    # If the post is being published, send it to Sanity
    if status_update.status.lower() == 'published':
        try:
            if not updated_post.content:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot publish a post with no content."
                )
            # Parse frontmatter from the content
            parsed_post = frontmatter.loads(updated_post.content)
            post_content = parsed_post.content
            frontmatter_metadata = parsed_post.metadata

            post_slug = slugify(f"{updated_post.title}-{updated_post.id.split('-')[-1]}", max_len=None)
            
            description = frontmatter_metadata.get('description')
            if not isinstance(description, (str, type(None))):
                description = str(description) if description is not None else None

            tags = frontmatter_metadata.get('tags', [])
            if not isinstance(tags, list):
                tags = []

            categories = frontmatter_metadata.get('categories', [])
            if not isinstance(categories, list):
                categories = []
            
            featured_image_url = updated_post.image_urls[0] if updated_post.image_urls else None

            await sanity_service.create_or_replace_blog_post(
                title=updated_post.title,
                slug=post_slug,
                body_markdown=post_content,
                description=description,
                tags=tags,
                categories=categories,
                featured_image_url=featured_image_url,
            )
        except Exception as e:
            # If Sanity fails, we should ideally roll back the status change
            # For now, we'll just raise an error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to publish to Sanity: {str(e)}"
            )

    return updated_post 
    