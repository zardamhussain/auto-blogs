import asyncio
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

from ..models.blog_prompt import StyleGuideResponse

from .base_data_service import BaseDataService
from .supabase_service import SupabaseDataService
from .gemini_service import GeminiService



class PromptService:
    def __init__(self):
        self.db_service = SupabaseDataService()
        self.gemini_service = GeminiService()

    async def _generate_or_update_image_style(
        self,
        image_style_suggestion: Optional[str],
        inspiration_images: List[UploadFile],
        negative_images: List[UploadFile],
        existing_image_style: Optional[str],
        brand_images: List[str],
    ) -> str:
        """
        Constructs the prompt, calls Gemini, and returns a formatted string for the image style guide.
        """
        prompt_parts = []

        prompt_parts.append(
            """
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
"""
        )

        # Context for updating
        if existing_image_style:
            prompt_parts.append(
                "You are UPDATING an existing style guide. Integrate the new feedback seamlessly into the existing structure, making targeted changes."
            )
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
        # Process brand images
        if brand_images:
            prompt_parts.append("\nAnalyze the following BRAND IMAGES to understand the brand's visual identity:")
            for image_url in brand_images:
                prompt_parts.append(image_url)
        # Final instruction
        prompt_parts.append(
            "\nBased on all the provided context, generate the complete, updated image style guide. Output only the text of the guide, without any headers or markdown formatting."
        )

        try:
            # Use the multimodal method, expecting a plain text response
            response = await self.gemini_service.call_gemini_multimodal(prompt_parts, expect_json=False)
            return response.text.strip()

        except Exception as e:
            # Catch other potential errors from the service call
            raise HTTPException(status_code=500, detail=f"An error occurred during image style generation: {str(e)}")

    async def generate_style_guide(
        self,
        project_id: str,
        use_brand_context: bool,
        base_knowledge_prompt: Optional[str],
        writing_style_prompt: Optional[str],
        image_style_suggestion: Optional[str],
        inspiration_images: List[UploadFile],
        negative_images: List[UploadFile],
        existing_base_knowledge: Optional[str],
        existing_writing_style: Optional[str],
        existing_image_style: Optional[str],
    ) -> StyleGuideResponse:
        """
        Generates a style guide based on provided prompts, context, and images.
        This service method orchestrates the generation of base knowledge, writing style,
        and image style guides by calling the Gemini service.
        """
        print(f"Generating style guide for project_id: {project_id}")
        if not self.gemini_service.model:
            raise HTTPException(status_code=503, detail="AI model is not available.")

        brand_content = ""
        brand_images = []
        if use_brand_context and project_id:
            print("Using brand context")
            project = self.db_service.get_project_by_id(project_id)
            if project and project.brand_content:
                brand_content = f"Please heavily reference the following brand context in your response:\n\n--- BRAND CONTEXT ---\n{project.brand_content}\n--- END BRAND CONTEXT ---\n\n"
                print("Loaded brand content")
            if project and project.brand_images:
                brand_images = project.brand_images
                print(f"Loaded {len(brand_images)} brand images")
        try:
            result = StyleGuideResponse()
            tasks = []
            task_types = []

            if base_knowledge_prompt or existing_base_knowledge or brand_content:
                print("Generating base knowledge guide")
                prompt_parts = []
                if existing_base_knowledge:
                    prompt_parts.append(
                        "You are UPDATING an existing base knowledge guide. Integrate the new feedback seamlessly, making targeted changes to improve the content based on the user's suggestion."
                    )
                    prompt_parts.append(f"CURRENT BASE KNOWLEDGE:\n{existing_base_knowledge}")
                    prompt_parts.append(f"\nUSER'S SUGGESTION FOR IMPROVEMENT:\n{base_knowledge_prompt}")
                    prompt_parts.append(
                        "\n\nBased on the suggestion, provide the complete, updated base knowledge guide. Do not use headers or markdown formatting. Output only the updated text."
                    )
                else:
                    prompt_parts.append(
                        f"""
                    You are an expert in content strategy and product knowledge. Generate comprehensive base knowledge about the following topic/niche:

                    Topic: "{base_knowledge_prompt}"

                    Include:
                    - Core concepts and definitions
                    - Key features, benefits, or value propositions
                    - Target audience description
                    - Common problems or pain points the product/niche addresses

                    Format the response as clear, organized paragraphs. Do not use headers or markdown formatting.
                    """
                    )
                if brand_content:
                    prompt_parts.append(f"Brand Context: {brand_content}")
                base_prompt = "\n".join(prompt_parts)
                tasks.append(self.gemini_service.call_gemini_with_retry(base_prompt, expect_json=False))
                task_types.append("base_knowledge")

            if writing_style_prompt or existing_writing_style or brand_content:
                print("Generating writing style guide")
                prompt_parts = []
                if existing_writing_style:
                    prompt_parts.append(
                        "You are UPDATING an existing writing style guide. Integrate the new feedback seamlessly, making targeted changes to improve the guide based on the user's suggestion."
                    )
                    prompt_parts.append(f"CURRENT WRITING STYLE GUIDE:\n{existing_writing_style}")
                    prompt_parts.append(f"\nUSER'S SUGGESTION FOR IMPROVEMENT:\n{writing_style_prompt}")
                    prompt_parts.append(
                        "\n\nBased on the suggestion, provide the complete, updated writing style guide. Do not use headers or markdown formatting. Output only the updated text."
                    )
                else:
                    prompt_parts.append(
                        f"""
                    You are an expert in content writing and branding. Generate a detailed writing style guide based on:

                    Style Description: "{writing_style_prompt}"

                    Include:
                    - Tone of voice (e.g., formal, witty, academic)
                    - Target audience reading level
                    - Sentence and paragraph structure guidelines
                    - Preferred vocabulary and forbidden words
                    - Formatting preferences (e.g., use of headings, bolding, lists)

                    Format the response as clear, organized paragraphs. Do not use headers or markdown formatting.
                    """
                    )
                if brand_content:
                    prompt_parts.append(f"Brand Context: {brand_content}")
                style_prompt = "\n".join(prompt_parts)
                tasks.append(self.gemini_service.call_gemini_with_retry(style_prompt, expect_json=False))
                task_types.append("writing_style_guide")

            if inspiration_images or negative_images or image_style_suggestion or existing_image_style or brand_images:
                print("Generating image style guide")
                tasks.append(
                    self._generate_or_update_image_style(
                        image_style_suggestion=image_style_suggestion,
                        inspiration_images=inspiration_images,
                        negative_images=negative_images,
                        existing_image_style=existing_image_style,
                        brand_images=brand_images,
                    )
                )
                task_types.append("image_style")

            if not tasks:
                print("No tasks to run for style guide generation.")
                return StyleGuideResponse(base_knowledge="", writing_style_guide="", image_style="")

            print(f"Running {len(tasks)} tasks: {task_types}")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            print("All tasks finished.")

            errors = []
            for task_result, task_type in zip(results, task_types):
                if isinstance(task_result, Exception):
                    errors.append(f"{task_type.replace('_', ' ').title()} generation failed: {str(task_result)}")
                    print(f"Error in {task_type}: {task_result}")
                else:
                    if task_type == "image_style":
                        setattr(result, task_type, task_result)
                        print(f"Successfully generated {task_type}")
                    else:
                        setattr(result, task_type, task_result.text.strip())
                        print(f"Successfully generated {task_type}")

            if errors:
                error_message = "; ".join(errors)
                print(f"Partial failure during guide generation: {error_message}")
                raise HTTPException(status_code=500, detail=f"Partial failure during guide generation: {error_message}")

            print("Style guide generation successful.")
            return result

        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            print(f"Error during guide generation: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate guide: {str(e)}") 
        