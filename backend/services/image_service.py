import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

class ImageService:
    def __init__(self):
        pass
  
    def generate_image(self, image_prompt: str, size: str = "1024x1024"):
        """
        Generates an image using Gemini and returns the image bytes.
        """
        full_prompt = image_prompt
        client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
        try:
            response = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=full_prompt,
            config=types.GenerateContentConfig(
            response_modalities=['TEXT', 'IMAGE']
            )
        )

            for part in response.candidates[0].content.parts:

                if part.inline_data is not None:
                    image_bytes = part.inline_data.data
            
            
            if not image_bytes:
                print("Gemini response did not contain image data.")
                if response.text:
                    print(f"Gemini text response: {response.text}")
                return None

            # Return the bytes and the original prompt as description
            return {
                "image_bytes": image_bytes,
                "image_description": full_prompt 
            }
        except Exception as e:
            print(f"Error generating image with Gemini: {e}")
            return None

def get_image_service():
    return ImageService() 