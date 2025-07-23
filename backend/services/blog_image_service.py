from backend.services.image_service import ImageService
from backend.utils.supabase_service import SupabaseClient
import requests
import uuid
import os
import google.generativeai as genai
from dotenv import load_dotenv
from ..db.constants import gemini_model_type
from ..models.media_file import MediaFileCreate
from .workflow_db_service import WorkflowDbService

load_dotenv(dotenv_path="backend/.env")

try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY must be set for alt text generation.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel(gemini_model_type)
except ValueError as e:
    print(f"Error initializing Gemini in blog_image_service: {e}")
    gemini_model = None

class BlogImageService:
    def __init__(self, image_service: ImageService, supabase_client: SupabaseClient):
        self.image_service = image_service
        self.supabase_client = supabase_client

    async def _generate_alt_text(self, image_prompt: str) -> str:
        """Generates a concise and descriptive alt text from an image prompt."""
        if not gemini_model:
            print("Gemini model not available. Falling back to basic alt text.")
            return f"An illustrative image about: {image_prompt[:100]}"
            
        alt_text_prompt = f"""
        Based on the following DALL-E image prompt, generate a concise and descriptive alt text suitable for an SEO-friendly blog post.
        The alt text should describe the key elements of the image that would be generated. Do not mention DALL-E or that it is a generated image.
        The alt text should be a single sentence, and no more than 125 characters.

        IMAGE PROMPT:
        ---
        {image_prompt}
        ---

        ALT TEXT:
        """
        try:
            response = await gemini_model.generate_content_async(alt_text_prompt)
            return response.text.strip().replace("\"", "") # Remove quotes from response
        except Exception as e:
            print(f"Error generating alt text with Gemini: {e}")
            return f"An illustrative image about: {image_prompt[:100]}"

    async def generate_and_upload_image(self, image_prompt: str, project_id: int, size: str, db_service: WorkflowDbService) -> dict:
        """
        Generates an image from a prompt, uploads it to a project-specific folder,
        and returns its path and public URL.
        """
        try:
            # 1. Generate alt text
            alt_text = await self._generate_alt_text(image_prompt)
            print(f"Generated alt text: '{alt_text}'")

            # 2. Validate the size parameter
            valid_sizes = ["1024x1024", "1024x1792", "1792x1024"]
            if size not in valid_sizes:
                raise ValueError(f"Invalid size '{size}'. Must be one of {valid_sizes}")
            width, height = map(int, size.split('x'))

            # 3. Generate the image using the core ImageService
            print(f"Generating {size} image with prompt: '{image_prompt[:50]}...'")
            image_object = self.image_service.generate_image(image_prompt=image_prompt, size=size)

            if not image_object or not image_object.get("image_bytes"):
                print("Image generation failed, returned no image data.")
                return None

            image_bytes = image_object["image_bytes"]

            # 4. Upload the image to Supabase in a project-specific folder
            storage_bucket = "blog-images"
            # Create a unique path within the project's folder
            file_path = f"{project_id}/{uuid.uuid4()}.png"
            
            print(f"Uploading image to Supabase at path: {storage_bucket}/{file_path}")
            
            self.supabase_client.upload_file(
                storage_name=storage_bucket,
                path=file_path,
                file_body=image_bytes,
                file_options={'content-type': 'image/png'}
            )

            # 5. Get the public URL
            print(f"Retrieving public URL for {file_path}")
            public_url = self.supabase_client.get_public_url(storage_name=storage_bucket, path=file_path)

            # 6. Save metadata to the media_files table
            media_file_payload = MediaFileCreate(
                project_id=project_id,
                path=file_path,
                url=public_url,
                alt_text=alt_text,
                type="image",
                width=width,
                height=height,
                description=image_object["image_description"]
            )
            media_file_record = db_service.create_media_file(media_file_payload)
            if not media_file_record:
                # Log an error but don't fail the whole operation
                print(f"Failed to save media file record to database for path: {file_path}")

            # Return all the metadata, including the new ID
            return {
                "media_file_id": str(media_file_record.id) if media_file_record else None,
                "path": file_path, 
                "url": public_url, 
                "width": width, 
                "height": height, 
                "alt_text": alt_text,
            }

        except Exception as e:
            print(f"An unexpected error occurred in generate_and_upload_image: {e}")
            return None

def get_blog_image_service() -> BlogImageService:
    from .image_service import get_image_service
    from ..utils.supabase_service import get_supabase_client
    
    image_service = get_image_service()
    supabase_client = get_supabase_client()
    
    return BlogImageService(image_service=image_service, supabase_client=supabase_client) 

