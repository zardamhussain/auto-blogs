from fastapi import APIRouter, HTTPException, Depends, status, Form, UploadFile, File
from typing import List, Optional
from PIL import Image
import io

from ..dependencies import get_data_service, get_current_user
from ..services.base_data_service import BaseDataService
from ..models.blog_prompt import BlogPrompt, BlogPromptCreate, BlogPromptUpdate, PromptStatusUpdate, StyleGuideResponse
from ..models.user import User
from ..services.gemini_service import GeminiService
from ..services.prompt_service import PromptService


# --- Router Setup ---
router = APIRouter(
    prefix="/prompts",
    tags=["Prompts & Writing Styles"]
)


# --- API Endpoint ---
@router.post("/generate-style-guide", response_model=StyleGuideResponse)
async def generate_style_guide(
    project_id: str = Form(...),
    use_brand_context: bool = Form(False),
    base_knowledge_prompt: Optional[str] = Form(None),
    writing_style_prompt: Optional[str] = Form(None),
    image_style_suggestion: Optional[str] = Form(None),
    inspiration_images: List[UploadFile] = File([]),
    negative_images: List[UploadFile] = File([]),
    existing_base_knowledge: Optional[str] = Form(None),
    existing_writing_style: Optional[str] = Form(None),
    existing_image_style: Optional[str] = Form(None),
):
    """
    Takes prompts and generates all provided knowledge types at once.
    Each type is optional - only generates content for provided prompts.
    Handles both text-only and multi-modal (text + image) for image style generation.
    Can also update an existing image style guide with new suggestions and images.
    """
    prompt_service = PromptService()
    return await prompt_service.generate_style_guide(
        project_id=project_id,
        use_brand_context=use_brand_context,
        base_knowledge_prompt=base_knowledge_prompt,
        writing_style_prompt=writing_style_prompt,
        image_style_suggestion=image_style_suggestion,
        inspiration_images=inspiration_images,
        negative_images=negative_images,
        existing_base_knowledge=existing_base_knowledge,
        existing_writing_style=existing_writing_style,
        existing_image_style=existing_image_style,
    )
   

async def generate_or_update_image_style(
    gemini_service: GeminiService,
    image_style_suggestion: Optional[str],
      inspiration_images: List[UploadFile],
    negative_images: List[UploadFile],
    existing_image_style: Optional[str],
) -> str:
    """
    Constructs the prompt, calls Gemini, and returns a formatted string for the image style guide.
    """
    prompt_parts = []
    
    prompt_parts.append(f"""
You are an expert Prompt Analyst and Image Style Expert tasked with generating highly adaptive, sophisticated, and detailed image-generation prompts for AI models (such as DALL·E, Midjourney, Stable Diffusion, etc.).

Perform a deep, structured analysis for creating a "General Style Prefix" and detailed "Image Prompt" that can be reused consistently. The analysis must adapt dynamically to:

Step 1: General Style Prefix Analysis

User's Input Prompt:

Clearly identify and articulate the intent of the user's prompt.

Analyze the underlying emotion and tone (playful, serious, educational, inviting, professional, empathetic, etc.).

List the core visual message that needs to be communicated.

Identify the target audience and the anticipated viewer reaction.

Reference Image(s) Provided by User (if any):

Extract detailed visual style characteristics (illustration, realism, minimalism, photography, digital art, etc.).

Analyze color schemes (primary colors, secondary colors, pastel, vibrant, monochrome, etc.).

Font and typography analysis (font style, boldness, readability, friendliness, elegance, etc.).

Examine composition and layout preferences (symmetrical, asymmetrical, balanced, minimalist, detailed).

Evaluate graphical elements (icons, shapes, decorative accents).

Detect the emotional or atmospheric qualities present (peaceful, energetic, calming, dynamic, cozy, clinical, modern, vintage, etc.).

Then, based on the above detailed analysis, create a highly adaptive and structured General Style Prefix:
Adaptive General Style Prefix Template:
Create a visually engaging, high-quality image tailored for web or digital use, clearly conveying the intent of: [User's Intent Clearly Summarized].

Emotion/Tone: [Precisely describe the emotional atmosphere and tone].

Visual Style: [Clearly specify the visual style derived from analysis—minimalist, illustrative, realistic, digital art, photography, etc.].

Color Palette: [Clearly detail primary, secondary colors, gradient style, monochrome, pastel, vibrant, etc.].

Typography: [Precisely define font characteristics—bold, serif/sans-serif, readability, elegance, friendliness, or explicitly state if text is not desired].

Composition/Layout: [Symmetrical/asymmetrical, centered text, visual balance, minimalist or detailed, text-to-visual ratio].

Graphical Elements: [Explicitly mention types of icons, shapes, decorative or supportive visual elements required].

Target Audience & Viewer Reaction: [Clearly state the target audience and the intended emotional or cognitive reaction from viewers].

Additional Detailed Instructions: [Any specific lighting, texture, rendering quality, or artistic nuances required to ensure high-fidelity replication].

                        Do not use headers or markdown formatting.
""")

    # Context for updating
    if existing_image_style:
        prompt_parts.append("You are UPDATING an existing style guide. Integrate the new feedback seamlessly into the existing structure, making targeted changes.")
        prompt_parts.append(f"CURRENT STYLE GUIDE:\n{existing_image_style}")

    # User's text suggestion
    if image_style_suggestion:
        prompt_parts.append(f"USER'S SUGGESTION:\n{image_style_suggestion}")

    # Process inspiration images
    if inspiration_images:
        prompt_parts.append("\nAnalyze the following INSPIRATION IMAGES to capture the desired aesthetic:")
        for image_file in inspiration_images:
            image_bytes = await image_file.read()
            image = Image.open(io.BytesIO(image_bytes))
            prompt_parts.append(image)

    # Process negative images
    if negative_images:
        prompt_parts.append("\nAnalyze the following NEGATIVE EXAMPLES to understand what to AVOID:")
        for image_file in negative_images:
            image_bytes = await image_file.read()
            image = Image.open(io.BytesIO(image_bytes))
            prompt_parts.append(image)
    # Final instruction
    prompt_parts.append("\nBased on all the provided context, generate the complete, updated image style guide. Output only the text of the guide, without any headers or markdown formatting.")
    
    try:
        # Use the multimodal method, expecting a plain text response
        response = await gemini_service.call_gemini_multimodal(prompt_parts, expect_json=False)
        return response.text.strip()

    except Exception as e:
        # Catch other potential errors from the service call
        raise HTTPException(status_code=500, detail=f"An error occurred during image style generation: {str(e)}")

# --- CRUD for Prompts ---

@router.post("/", response_model=BlogPrompt, status_code=status.HTTP_201_CREATED)
def create_prompt(
    prompt_data: BlogPromptCreate,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user)
):  

    prompt = data_service.create_prompt(prompt_data, user.id, (f"{user.first_name}" if user.first_name else "") + (f" {user.last_name}" if user.last_name else ""))
    if not prompt:
        raise HTTPException(status_code=400, detail="Could not create the prompt.")
    return prompt

@router.get("/project/{project_id}", response_model=List[BlogPrompt])
def get_prompts_for_project(
    project_id: str,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user) # for auth
):
    # TODO: Add logic to check if user has access to the project
    print(f"Fetching prompts for project {project_id}")
    prompts = data_service.get_prompts_by_project_id(project_id)
    print(f"Found {len(prompts)} prompts for project {project_id}: {[{'id': p.id, 'name': p.name, 'is_active': p.is_active} for p in prompts]}")
    return prompts

@router.get("/{prompt_id}", response_model=BlogPrompt)
def get_prompt(
    prompt_id: str,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user)
):
    prompt = data_service.get_prompt_by_id(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    # TODO: Check if user has access to this prompt's project
    return prompt

@router.patch("/{prompt_id}", response_model=BlogPrompt)
def update_prompt(
    prompt_id: str,
    prompt_data: BlogPromptUpdate,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user)
):
    # TODO: Check if user has permission to update
    updated_prompt = data_service.update_prompt(prompt_id, prompt_data)
    if not updated_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found or update failed.")
    return updated_prompt

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    prompt_id: str,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user)
):
    # TODO: Check permissions
    success = data_service.delete_prompt(prompt_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return

@router.patch("/{prompt_id}/status", response_model=BlogPrompt)
def update_prompt_status(
    prompt_id: str,
    status_update: PromptStatusUpdate,
    data_service: BaseDataService = Depends(get_data_service),
    user: User = Depends(get_current_user)
):
    # TODO: Check permissions
    updated_prompt = data_service.set_prompt_active_status(prompt_id, status_update.is_active)
    if not updated_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found or update failed.")
    return updated_prompt 