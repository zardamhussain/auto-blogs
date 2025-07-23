# import os
# import json
# import time
# import threading
# import requests
# from queue import Queue
# from typing import Dict, List, Optional, Tuple
# from datetime import datetime
# from dataclasses import dataclass, asdict
# from openai import OpenAI
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Constants
# # Get the absolute path of the project root
# PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
# COSMI_BLOGS_DIR = os.path.join(PROJECT_ROOT, "cosmi-blogs")
# IMAGES_DIR = os.path.join(COSMI_BLOGS_DIR, "assets", "images")
# CONTEXT_FILE = os.path.join(os.path.dirname(__file__), "image_context.json")
# IMAGE_BLOG_MAP_FILE = os.path.join(os.path.dirname(__file__), "image_blog_map.json")
# MAX_CONTEXT_MESSAGES = 5

# # Get OpenAI API key from environment
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# if OPENAI_API_KEY:
#     print(f"OpenAI API key loaded (starts with: {OPENAI_API_KEY[:10]}...)")
# else:
#     print("WARNING: OpenAI API key not found in environment variables")

# # Default context for image generation
# DEFAULT_CONTEXT = """
# COSMI BLOGS – IMAGE CONTEXT FOR GENERATION
# Brand Style Name:
# Cosmi Blogs

# Visual Identity:

# Logo placement: Top-left corner of the image labeled as: cosmi blogs or COSMI BLOGS in soft purple tones

# Typography: Clear font hierarchy:

# Big Bold Heading – Main blog title/question

# Subheadline – Clarifying benefit/tip (e.g. "Here's What Experts Say")

# Callouts – Labels like "Seals It In," "Absorbs First," "Brighten & Protect"

# Backgrounds: Soft, radiant gradients like:

# Lavender, peach, beige, mint, citrus

# Clean, minimal with icons or sparkle overlays

# Layout Patterns:

# Split-style: Before/After, Wrong/Right, or AM/PM

# Vertical Step-by-Step (e.g., Cleanse → Serum → Moisturizer)

# Ingredient vs Ingredient comparisons (e.g., Salicylic vs Niacinamide)

# Full glowing face with supporting callouts

# Character Design & Emotion:

# Diverse skin tones and facial features

# Left side: Problem face – worried, inspecting skin

# Right side: Solution face – glowing, relaxed, applying product

# Occasional cartoon/illustration hybrid for humor (e.g., lotion mistakes)

# Overlay Elements:

# Product dropper bottles, cream jars, mist sprays

# Ingredient icons (Vitamin C, Retinol, SPF, Peels)

# ✅ "Derms Say" / ❌ "Wrong" / ⚠ "Myth" or "Alert" labels

# Sparkle, glow icons or skin overlays to show effect

# Use Case & Purpose:

# Social media skincare blog headers

# Educational skincare content

# Pinterest blog covers

# Visual summaries for skincare tips
# """

# def verify_openai_api_key(api_key: str) -> Tuple[bool, str]:
#     """
#     Verify that the OpenAI API key is valid
    
#     Args:
#         api_key: The API key to verify
        
#     Returns:
#         Tuple of (is_valid, message)
#     """
#     if not api_key:
#         return False, "API key is empty"
    
#     try:
#         # Initialize client with the provided key
#         client = OpenAI(api_key=api_key)
        
#         # Make a minimal API call to verify the key
#         response = client.models.list()
        
#         # If we get here, the key is valid
#         return True, f"API key verified successfully (starts with: {api_key[:10]}...)"
#     except Exception as e:
#         return False, f"API key verification failed: {str(e)}"

# @dataclass
# class ImageRequest:
#     """Data class for image generation requests"""
#     blog_id: str  # Using blog ID from Supabase
#     prompt: str
#     timestamp: str = None
#     status: str = "pending"  # pending, processing, completed, failed
    
#     def __post_init__(self):
#         if not self.timestamp:
#             self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")


# @dataclass
# class ChatMessage:
#     """Data class for chat messages in the context"""
#     role: str  # 'system', 'user', or 'assistant'
#     content: str


# class ImageGenerationQueue:
#     """Manages a queue of image generation requests"""
    
#     def __init__(self):
#         self.queue = Queue()
#         self.processing = False
#         self.context_map = self._load_context_map()
#         self.image_blog_map = self._load_image_blog_map()
        
#         # Get API key directly from environment
#         api_key = os.getenv("OPENAI_API_KEY")
#         if not api_key:
#             print("ERROR: OpenAI API key not found in environment variables")
#             raise ValueError("OpenAI API key not found")
            
#         # Verify the API key
#         is_valid, message = verify_openai_api_key(api_key)
#         if not is_valid:
#             print(f"ERROR: {message}")
#             raise ValueError(f"Invalid OpenAI API key: {message}")
#         else:
#             print(f"SUCCESS: {message}")
        
#         # Initialize OpenAI client with explicit API key
#         self.client = OpenAI(api_key=api_key)
        
#         # Create directories if they don't exist
#         os.makedirs(IMAGES_DIR, exist_ok=True)
        
#         # Initialize with default context if needed
#         for blog_id, context in self.context_map.items():
#             if not context:
#                 self.context_map[blog_id] = [
#                     ChatMessage(role="system", content=DEFAULT_CONTEXT)
#                 ]
    
#     def _load_context_map(self) -> Dict[str, List[ChatMessage]]:
#         """Load context map from file or initialize if not exists"""
#         if os.path.exists(CONTEXT_FILE):
#             try:
#                 with open(CONTEXT_FILE, 'r') as f:
#                     data = json.load(f)
                    
#                 # Convert raw data to ChatMessage objects
#                 context_map = {}
#                 for blog_id, messages in data.items():
#                     context_map[blog_id] = [
#                         ChatMessage(**msg) for msg in messages
#                     ]
#                 return context_map
#             except Exception as e:
#                 print(f"Error loading context map: {e}")
#                 return {}
#         return {}
    
#     def _save_context_map(self):
#         """Save context map to file"""
#         try:
#             # Convert ChatMessage objects to dictionaries
#             serializable_map = {}
#             for blog_id, messages in self.context_map.items():
#                 serializable_map[blog_id] = [asdict(msg) for msg in messages]
                
#             with open(CONTEXT_FILE, 'w') as f:
#                 json.dump(serializable_map, f, indent=2)
#         except Exception as e:
#             print(f"Error saving context map: {e}")
    
#     def _load_image_blog_map(self) -> Dict[str, str]:
#         """Load image-blog mapping from file or initialize if not exists"""
#         if os.path.exists(IMAGE_BLOG_MAP_FILE):
#             try:
#                 with open(IMAGE_BLOG_MAP_FILE, 'r') as f:
#                     return json.load(f)
#             except Exception as e:
#                 print(f"Error loading image-blog map: {e}")
#                 return {}
#         return {}
    
#     def _save_image_blog_map(self):
#         """Save image-blog mapping to file"""
#         try:
#             with open(IMAGE_BLOG_MAP_FILE, 'w') as f:
#                 json.dump(self.image_blog_map, f, indent=2)
#         except Exception as e:
#             print(f"Error saving image-blog map: {e}")
    
#     def add_request(self, request: ImageRequest):
#         """Add a request to the queue"""
#         self.queue.put(request)
        
#         # Initialize context for this blog if it doesn't exist
#         if request.blog_id not in self.context_map:
#             self.context_map[request.blog_id] = [
#                 ChatMessage(role="system", content=DEFAULT_CONTEXT)
#             ]
        
#         # Add user prompt to context
#         self.context_map[request.blog_id].append(
#             ChatMessage(role="user", content=request.prompt)
#         )
        
#         # Trim context to keep only the most recent messages
#         if len(self.context_map[request.blog_id]) > MAX_CONTEXT_MESSAGES + 1:  # +1 for system message
#             # Always keep the system message (first one)
#             self.context_map[request.blog_id] = [
#                 self.context_map[request.blog_id][0]
#             ] + self.context_map[request.blog_id][-(MAX_CONTEXT_MESSAGES):]
        
#         self._save_context_map()
        
#         # Start processing if not already running
#         if not self.processing:
#             threading.Thread(target=self._process_queue, daemon=True).start()
    
#     def _process_queue(self):
#         """Process requests in the queue"""
#         self.processing = True
        
#         while not self.queue.empty():
#             request = self.queue.get()
            
#             try:
#                 request.status = "processing"
#                 print(f"Processing image request for blog ID: {request.blog_id}")
                
#                 # Get context for this blog
#                 context = self.context_map.get(request.blog_id, [
#                     ChatMessage(role="system", content=DEFAULT_CONTEXT),
#                     ChatMessage(role="user", content=request.prompt)
#                 ])
                
#                 # Format messages for OpenAI API
#                 messages = [{"role": msg.role, "content": msg.content} for msg in context]
                
#                 # Verify API key before making the request
#                 api_key = self.client.api_key
#                 if not api_key:
#                     raise ValueError("OpenAI API key is not set")
#                 print(f"Using OpenAI API key starting with: {api_key[:10]}...")
                
#                 # Generate image with DALL-E
#                 print(f"Generating image with prompt: {request.prompt[:50]}...")
#                 response = self.client.images.generate(
#                     model="dall-e-3",
#                     prompt=request.prompt,
#                     size="1024x1024",
#                     quality="standard",
#                     n=1,
#                 )
                
#                 # Get the image URL from the response
#                 image_url = response.data[0].url
#                 print(f"Image URL received: {image_url[:60]}...")
                
#                 # Download the image using requests
#                 print("Downloading image...")
#                 image_response = requests.get(image_url, stream=True)
#                 if image_response.status_code == 200:
#                     # Generate filename with timestamp
#                     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
#                     image_filename = f"{timestamp}.png"
#                     image_path = os.path.join(IMAGES_DIR, image_filename)
                    
#                     # Save image to file
#                     with open(image_path, "wb") as f:
#                         for chunk in image_response.iter_content(chunk_size=8192):
#                             f.write(chunk)
                    
#                     print(f"Image saved to: {image_path}")
                    
#                     # Update image-blog mapping with relative path for consistency
#                     self.image_blog_map[request.blog_id] = f"images/{image_filename}"
#                     self._save_image_blog_map()
                    
#                     # Add assistant response to context
#                     self.context_map[request.blog_id].append(
#                         ChatMessage(role="assistant", content=f"Generated image: {image_filename}")
#                     )
#                     self._save_context_map()
                    
#                     request.status = "completed"
#                     print(f"Image generated successfully for blog ID: {request.blog_id}")
#                 else:
#                     raise Exception(f"Failed to download image: {image_response.status_code}")
                
#             except Exception as e:
#                 print(f"Error generating image: {e}")
#                 request.status = "failed"
            
#             # Give a short pause between requests to avoid rate limiting
#             time.sleep(1)
            
#             self.queue.task_done()
        
#         self.processing = False
    
#     def get_image_for_blog(self, blog_id: str) -> Optional[str]:
#         # For debugging
#         print(f"Looking up image for blog ID: {blog_id}")
#         print(f"Available mappings: {list(self.image_blog_map.keys())}")
        
#         # Direct lookup by blog ID
#         if blog_id in self.image_blog_map:
#             return self.image_blog_map[blog_id]
        
#         # Legacy support for filenames
#         if blog_id.endswith('.md'):
#             # For file-based posts, try to match by removing path and extensions
#             base_name = os.path.basename(blog_id)
#             base_name_no_ext = os.path.splitext(base_name)[0]
            
#             # Check for any match with this base name
#             for key, value in self.image_blog_map.items():
#                 # Skip non-filename keys (database IDs)
#                 if not key.endswith('.md'):
#                     continue
                    
#                 key_base = os.path.basename(key)
#                 key_base_no_ext = os.path.splitext(key_base)[0]
                
#                 if key_base_no_ext == base_name_no_ext:
#                     return value
        
#         return None
    
#     def get_context_for_blog(self, blog_id: str) -> List[ChatMessage]:
#         """Get the context for a blog"""
#         return self.context_map.get(blog_id, [
#             ChatMessage(role="system", content=DEFAULT_CONTEXT)
#         ])
    
#     def update_global_context(self, new_context: str):
#         """Update the global default context"""
#         global DEFAULT_CONTEXT
#         DEFAULT_CONTEXT = new_context
        
#         # Update system message in all contexts
#         for blog_id in self.context_map:
#             if self.context_map[blog_id]:
#                 # Replace the first message if it's a system message
#                 if self.context_map[blog_id][0].role == "system":
#                     self.context_map[blog_id][0] = ChatMessage(role="system", content=new_context)
#                 else:
#                     # Insert a new system message at the beginning
#                     self.context_map[blog_id].insert(0, ChatMessage(role="system", content=new_context))
        
#         self._save_context_map()


# # Create a singleton instance
# image_queue = ImageGenerationQueue()


# def generate_image_for_blog(blog_id: str, custom_prompt: str = None) -> str:
#     # If no custom prompt is provided, create a generic one
#     if not custom_prompt:
#         custom_prompt = "Generate a high quality image for a skincare blog post"
    
#     # Create and add the request to the queue
#     request = ImageRequest(blog_id=blog_id, prompt=custom_prompt)
#     image_queue.add_request(request)
    
#     return f"Image generation requested for blog ID: {blog_id}"


# def get_blog_image(blog_id: str) -> Optional[str]:
#     """
#     Get the image path for a blog
    
#     Args:
#         blog_id: The blog ID from Supabase
        
#     Returns:
#         The relative path to the image (images/filename.png) or None if not found
#     """
#     return image_queue.get_image_for_blog(blog_id)


# def update_global_image_context(new_context: str):
#     """Update the global default context for image generation"""
#     image_queue.update_global_context(new_context)


# def get_current_global_context() -> str:
#     """Get the current global default context"""
#     return DEFAULT_CONTEXT 