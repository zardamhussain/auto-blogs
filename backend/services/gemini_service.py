import os
import json
import asyncio
import google.generativeai as genai
from ..db.constants import gemini_model_type

class GeminiService:
    def __init__(self):
        """Initializes the Gemini client."""
        try:
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if not gemini_api_key:
                raise ValueError("GEMINI_API_KEY must be set.")
            genai.configure(api_key=gemini_api_key)
            self.model = genai.GenerativeModel(gemini_model_type)
        except ValueError as e:
            print(f"Error initializing Gemini: {e}")
            self.model = None

    async def call_gemini_multimodal(self, prompt_parts: list, expect_json: bool = False):
        """
        Calls the Gemini API with a multimodal prompt (text and images).
        `prompt_parts` is a list of strings or image data (bytes or PIL.Image).
        """
        print(f"--- Calling Gemini Multimodal with {len(prompt_parts)} parts --- \n\n {prompt_parts} \n\n")

        # Multimodal calls require a vision-capable model.
        # We instantiate it here to avoid changing the default model for the service.
        vision_model = genai.GenerativeModel(gemini_model_type)

        generation_config = genai.GenerationConfig() if expect_json else None

        try:
            response = await vision_model.generate_content_async(
                prompt_parts,
                generation_config=generation_config
            )

            return response
        except (Exception, json.JSONDecodeError) as e:
            print(f"Error during Gemini multimodal call: {e}")
            raise RuntimeError(f"Failed to get a valid response from Gemini multimodal call: {e}")


    async def call_gemini_with_retry(self, prompt: str, expect_json: bool = False):
        """
        Calls the Gemini API with a given prompt.
        If expect_json is True, it will validate the response and ask Gemini to correct it if it's not valid JSON.
        It also has a retry mechanism using a fallback API key.
        """
        if not self.model:
            raise RuntimeError("Gemini model not initialized.")
            
        generation_config = genai.GenerationConfig(response_mime_type="application/json") if expect_json else None

        async def attempt(api_key, key_name):
            print(f"Attempting Gemini call with {key_name}...")
            try:
                # Configure a temporary client for this attempt
                temp_genai = genai
                temp_genai.configure(api_key=api_key)
                model = temp_genai.GenerativeModel(gemini_model_type)
                
                if not expect_json:
                    # For non-JSON, simple call, no chat history needed.
                    response = await model.generate_content_async(
                        prompt,
                        generation_config=generation_config
                    )
                    return response

                # For JSON, use a chat session to allow for correction.
                chat = model.start_chat()
                
                # First attempt to get valid JSON
                response = await chat.send_message_async(
                    prompt,
                    generation_config=generation_config
                )

                try:
                    # Try to parse the JSON. If it works, we're done with this attempt.
                    json.loads(response.text)
                    return response
                except json.JSONDecodeError as e:
                    print(f"Gemini response with {key_name} is not valid JSON. Asking for correction. Error: {e}")
                    
                    correction_prompt = (
                        "The previous response was not valid JSON. "
                        "Please output only the corrected JSON object, without any markdown, comments, or other text."
                    )
                    
                    corrected_response = await chat.send_message_async(
                        correction_prompt,
                        generation_config=generation_config
                    )
                    
                    json.loads(corrected_response.text)
                    print(f"Gemini successfully corrected the JSON with {key_name}.")
                    return corrected_response

            except (Exception, json.JSONDecodeError) as e:
                print(f"Gemini call with {key_name} failed: {e}")
                return None

        # Try with the primary key first
        primary_key = os.getenv("GEMINI_API_KEY")
        response = await attempt(primary_key, "GEMINI_API_KEY")
        if response:
            return response

        # If the primary key fails, try with the fallback key
        fallback_key = os.getenv("GEMINI_API_KEY_1")
        if fallback_key:
            print("Primary key failed, trying fallback key.")
            response = await attempt(fallback_key, "GEMINI_API_KEY_1")
            if response:
                return response

        raise RuntimeError("Failed to get a valid response from Gemini with both primary and fallback API keys.") 