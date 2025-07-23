# import streamlit as st
# import os
# from datetime import datetime, timezone
# import time
# try:
#     import yaml
# except ImportError:
#     st.warning("PyYAML not installed. Installing with 'pip install pyyaml' is recommended.")
#     # Fallback simple YAML parser for frontmatter
#     yaml = None
# import subprocess
# from src.blog_generators.unified_blog_generator import UnifiedBlogGenerator
# from src.image_generator.image_generator import (
#     generate_image_for_blog, 
#     get_blog_image, 
#     update_global_image_context, 
#     get_current_global_context
# )
# from src.utils.supabase_service import get_supabase_client

# ###########################################
# # CONSTANTS AND CONFIGURATION
# ###########################################

# # Get the absolute path of the project root
# PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
# COSMI_BLOGS_DIR = os.path.join(PROJECT_ROOT, "cosmi-blogs")
# IMAGES_DIR = os.path.join(COSMI_BLOGS_DIR, "assets", "images")
# POSTS_DIR = os.path.join(COSMI_BLOGS_DIR, "content", "posts")

# # Make sure these directories exist
# os.makedirs(IMAGES_DIR, exist_ok=True)
# os.makedirs(POSTS_DIR, exist_ok=True)

# # Get environment variables
# def get_env_var(key, default=""):
#     return os.environ.get(key, default)

# # Initialize the unified blog generator from environment variables
# def initialize_blog_generator():
#     # Get API keys from environment variables
#     gemini_api_key = get_env_var("GEMINI_API_KEY")
#     tavily_api_key = get_env_var("TAVILY_API_KEY")
#     firecrawl_api_key = get_env_var("FIRECRAWL_API_KEY")
    
#     # Load Reddit credentials from environment variables
#     reddit_credentials = []
    
#     # First set of Reddit credentials
#     if get_env_var("REDDIT_CLIENT_ID"):
#         reddit_credentials.append({
#             "client_id": get_env_var("REDDIT_CLIENT_ID"),
#             "client_secret": get_env_var("REDDIT_CLIENT_SECRET"),
#             "user_agent": get_env_var("REDDIT_USER_AGENT"),
#             "username": get_env_var("REDDIT_USERNAME"),
#             "password": get_env_var("REDDIT_PASSWORD"),
#         })
    
#     # Second set of Reddit credentials
#     if get_env_var("REDDIT_CLIENT_ID_1"):
#         reddit_credentials.append({
#             "client_id": get_env_var("REDDIT_CLIENT_ID_1"),
#             "client_secret": get_env_var("REDDIT_CLIENT_SECRET_1"),
#             "user_agent": get_env_var("REDDIT_USER_AGENT_1"),
#             "username": get_env_var("REDDIT_USERNAME_1"),
#             "password": get_env_var("REDDIT_PASSWORD_1"),
#         })
    
#     # Third set of Reddit credentials
#     if get_env_var("REDDIT_CLIENT_ID_2"):
#         reddit_credentials.append({
#             "client_id": get_env_var("REDDIT_CLIENT_ID_2"),
#             "client_secret": get_env_var("REDDIT_CLIENT_SECRET_2"),
#             "user_agent": get_env_var("REDDIT_USER_AGENT_2"),
#             "username": get_env_var("REDDIT_USERNAME_2"),
#             "password": get_env_var("REDDIT_PASSWORD_2"),
#         })
    
#     # Check if we have all required credentials
#     if gemini_api_key and tavily_api_key and firecrawl_api_key and reddit_credentials:
#         return UnifiedBlogGenerator(
#             reddit_credentials=reddit_credentials,
#             gemini_api_key=gemini_api_key,
#             tavily_api_key=tavily_api_key,
#             firecrawl_api_key=firecrawl_api_key,
#             skip_comparison=True  # Skip the comparison generator for performance
#         )
#     else:
#         missing = []
#         if not gemini_api_key: missing.append("Gemini API Key")
#         if not tavily_api_key: missing.append("Tavily API Key")
#         if not firecrawl_api_key: missing.append("Firecrawl API Key")
#         if not reddit_credentials: missing.append("Reddit Credentials")
        
#         st.error(f"Missing required credentials in .env file: {', '.join(missing)}")
#         return None

# ###########################################
# # HELPER FUNCTIONS
# ###########################################

# # Simple YAML frontmatter parser as fallback if PyYAML isn't available
# def parse_frontmatter(frontmatter_text):
#     """Parse YAML frontmatter without using the yaml module"""
#     metadata = {}
#     lines = frontmatter_text.strip().split('\n')
    
#     current_key = None
#     current_list = []
    
#     for line in lines:
#         line = line.strip()
#         if not line:
#             continue
            
#         # Check if this is a new key
#         if ':' in line and not line.startswith('-'):
#             # Save any previous list
#             if current_key and current_list:
#                 metadata[current_key] = current_list
#                 current_list = []
                
#             parts = line.split(':', 1)
#             key = parts[0].strip()
#             value = parts[1].strip() if len(parts) > 1 else ""
            
#             # Handle list start
#             if value == "":
#                 current_key = key
#                 current_list = []
#             else:
#                 metadata[key] = value
#                 current_key = None
        
#         # Handle list item
#         elif line.startswith('-') and current_key:
#             item = line[1:].strip()
#             current_list.append(item)
    
#     # Add the last list if there is one
#     if current_key and current_list:
#         metadata[current_key] = current_list
        
#     return metadata

# def load_markdown_blog_posts():
#     """Loads blog posts from Markdown files."""
#     blog_posts = []
#     total_files = 0
    
#     for filename in os.listdir():
#         if filename.endswith(".md") and filename.startswith("blog_post_"):
#             total_files += 1
#             try:
#                 with open(filename, "r", encoding="utf-8") as f:
#                     content = f.read()
                    
#                     # Parse frontmatter and content
#                     if content.startswith("---"):
#                         # Find the end of frontmatter
#                         end_frontmatter = content.find("---", 3)
#                         if end_frontmatter != -1:
#                             frontmatter = content[3:end_frontmatter].strip()
#                             body = content[end_frontmatter+3:].strip()
                            
#                             # Parse YAML frontmatter
#                             try:
#                                 if yaml:
#                                     metadata = yaml.safe_load(frontmatter)
#                                 else:
#                                     # Use fallback parser if PyYAML isn't available
#                                     metadata = parse_frontmatter(frontmatter)
                                    
#                                 post = {
#                                     'title': metadata.get('title', ''),
#                                     'description': metadata.get('description', ''),
#                                     'tags': metadata.get('tags', []),
#                                     'categories': metadata.get('categories', []),
#                                     'body': body,
#                                     '_filename': filename
#                                 }
#                                 blog_posts.append(post)
#                             except Exception as e:
#                                 st.error(f"Error parsing YAML frontmatter in {filename}: {e}")
#                         else:
#                             st.error(f"No YAML frontmatter found in {filename}")
#                     else:
#                         st.error(f"Invalid frontmatter format in {filename}")
#             except Exception as e:
#                 st.error(f"An error occurred while reading {filename}: {e}")
    
#     # Display count of total files found vs loaded
#     if total_files > 0:
#         st.info(f"Found {total_files} blog files, successfully loaded {len(blog_posts)} blogs.")
        
#     return blog_posts

# def save_blog_post_to_supabase(post: dict, project_id: str = "default", author_id: str = None):
#     """
#     Save a blog post to Supabase database.
    
#     Args:
#         post: The blog post dictionary containing title, description, tags, categories, and body
#         project_id: The project ID this blog belongs to (default: "default")
#         author_id: Optional author ID
        
#     Returns:
#         The created blog post or None if there was an error
#     """
#     try:
#         # Get Supabase client
#         supabase = get_supabase_client()
        
#         # Format the blog post content as markdown
#         tags_str = '\n'.join([f'  - {tag}' for tag in post['tags']])
#         categories_str = '\n'.join([f'  - {cat}' for cat in post['categories']])
        
#         # Create full markdown content
#         md_content = f"""---
# title: {post['title'].replace(':', '')}
# date: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z')}
# description: {post['description'].replace(':', '')}
# tags:
# {tags_str}
# categories:
# {categories_str}
# ---

# {post['body']}
# """
        
#         # Save to Supabase
#         blog_post = supabase.save_blog_post(
#             title=post['title'],
#             content=md_content,
#             project_id=project_id,
#             author_id=author_id
#         )
        
#         st.success(f"Blog post '{post['title']}' saved to database")
#         return blog_post
#     except Exception as e:
#         st.error(f"Error saving blog post to database: {e}")
#         return None

# def generate_unified_blog_posts(unified_processor: UnifiedBlogGenerator, query: str, total_blogs: int = 1):
#     """Generates a single blog post using the unified blog generator from combined data sources."""
#     try:
#         # Call the new generate_blog method which creates a single blog from combined sources
#         blog_post = unified_processor.generate_blog(query)
        
#         # Save the blog post to Supabase
#         project_id = st.session_state.get('project_id', 'default')
#         author_id = st.session_state.get('user_id')
#         save_blog_post_to_supabase(blog_post, project_id, author_id)
        
       
#         st.success(f"Generated blog post for query: '{query}'")
#         return [blog_post]  # Return as list for compatibility with existing code
#     except Exception as e:
#         st.error(f"Error generating blog post: {e}")
#         return []

# def clear_git_changes():
#     """Reset all changes in the git repository."""
#     try:
#         subprocess.run(['git', 'reset', '--hard', 'HEAD'], cwd=COSMI_BLOGS_DIR, check=True, 
#                       stderr=subprocess.PIPE, text=True)
#         subprocess.run(['git', 'clean', '-fd'], cwd=COSMI_BLOGS_DIR, check=True,
#                       stderr=subprocess.PIPE, text=True)
#         return True, "Git changes cleared successfully!"
#     except subprocess.CalledProcessError as e:
#         error_msg = e.stderr if e.stderr else str(e)
#         return False, f"Git operation failed: {error_msg}"

# def handle_image_upload(uploaded_file, target_folder=IMAGES_DIR):
#     """Handle image upload and return the relative path for blog post."""
#     if uploaded_file:
#         # Check if we've already uploaded this file by comparing file content hash
#         file_content = uploaded_file.getbuffer()
#         content_hash = hash(file_content.tobytes())
        
#         # Check if this file is already in session state
#         if 'uploaded_image_hashes' not in st.session_state:
#             st.session_state.uploaded_image_hashes = {}
            
#         # If we've seen this hash before, return the existing path
#         if content_hash in st.session_state.uploaded_image_hashes:
#             return st.session_state.uploaded_image_hashes[content_hash]
        
#         # Create target folder if it doesn't exist
#         os.makedirs(target_folder, exist_ok=True)
        
#         # Save file to images directory
#         file_extension = uploaded_file.name.split('.')[-1].lower()
#         filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.{file_extension}"
#         filepath = os.path.join(target_folder, filename)
        
#         with open(filepath, "wb") as f:
#             f.write(file_content)
        
#         # Store the hash and path in session state
#         relative_path = f"images/{filename}"
#         st.session_state.uploaded_image_hashes[content_hash] = relative_path
            
#         return relative_path  # Return relative path for blog post
#     return None

# def publish_to_cosmi_blogs(post, image_path=None):
#     """Convert blog post to cosmi-blogs format and save."""
#     # Create markdown content
#     tags_str = '\n'.join([f'  - {tag}' for tag in post['tags']])
#     categories_str = '\n'.join([f'  - {cat}' for cat in post['categories']])
    
#     # Use default image if none provided
#     final_image_path = "images/blog2.jpg"
    
#     # If an image path was provided
#     if image_path:
#         # Just use the path as is - don't copy the image again since it's already in the right place
#         final_image_path = image_path
    
#     md_content = f"""---
# title: {post['title'].replace(':', '')}
# date: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z')}
# description: {post['description'].replace(':', '')}
# tags:
# {tags_str}
# categories:
# {categories_str}
# image: {final_image_path}
# ---

# {post['body']}

# """
#     # Save to posts directory
#     # Sanitize filename: remove special chars and convert to kebab-case
#     filename = post['title'].lower()
#     # Replace special characters with empty string
#     filename = ''.join(c for c in filename if c.isalnum() or c.isspace())
#     # Replace spaces with hyphens and remove multiple hyphens
#     filename = '-'.join(filter(None, filename.split(' ')))
#     filename = filename + '.md'
    
#     filepath = os.path.join(POSTS_DIR, filename)
    
#     with open(filepath, 'w', encoding='utf-8') as f:
#         f.write(md_content)
        
#     return filepath

# def view_blog_posts(blog_posts):
#     """Displays blog posts with archive, delete, generate image, and publish functionality."""
#     if not blog_posts:
#         st.info("No blog posts found. Generate some!")
#         return

#     # Display count of blogs
#     st.write(f"## Generated Blog Posts ({len(blog_posts)} total)")
    
#     for i, post in enumerate(blog_posts):
#         # Get post ID - prefer database ID if available
#         post_id = post.get('_db_id', f"blog_post_{datetime.now().strftime('%Y%m%d')}_{i}")
        
#         # Get filename if available (for legacy support)
#         filename = post.get('_filename', f"blog_post_{datetime.now().strftime('%Y%m%d')}_{i}.md")
        
#         # Display post title
#         st.write(f"### {post['title']}")
#         st.write(f"**Description:** {post['description']}")
        
#         # Display tags and categories if they exist
#         if 'tags' in post and post['tags']:
#             st.write(f"**Tags:** {', '.join(post['tags'])}")
#         if 'categories' in post and post['categories']:
#             st.write(f"**Categories:** {', '.join(post['categories'])}")
            
#         # Display creation date if available
#         if post.get('_created_at'):
#             created_date = post.get('_created_at')
#             if isinstance(created_date, str):
#                 try:
#                     created_date = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
#                 except:
#                     pass
#             st.write(f"**Created:** {created_date}")
        
#         # Display status if available
#         if post.get('_status'):
#             st.write(f"**Status:** {post.get('_status')}")

#         with st.expander("Show Content"):
#             st.markdown(post["body"])

#         # Show action buttons for all posts
#         col1, col2, col3, col4 = st.columns(4)
        
#         with col1:
#             if st.button("Archive", key=f"archive_{i}"):
#                 try:
#                     # For database posts, update status to 'archived'
#                     if '_db_id' in post:
#                         supabase = get_supabase_client()
#                         supabase.client.table("blog_posts").update({"status": "archived"}).eq("id", post['_db_id']).execute()
#                         st.success(f"Archived post '{post['title']}'")
#                     else:
#                         # For local files, rename the file
#                         os.rename(filename, filename.replace(".md", "_archived.md"))
#                         st.success(f"Archived {filename}")
#                     st.rerun()
#                 except Exception as e:
#                     st.error(f"Error archiving post: {e}")

#         with col2:
#             if st.button("Delete", key=f"delete_{i}"):
#                 try:
#                     # For database posts, delete from Supabase
#                     if '_db_id' in post:
#                         supabase = get_supabase_client()
#                         supabase.client.table("blog_posts").delete().eq("id", post['_db_id']).execute()
#                         st.success(f"Deleted post '{post['title']}'")
#                     else:
#                         # For local files, delete the file
#                         os.remove(filename)
#                         st.success(f"Deleted {filename}")
#                     st.rerun()
#                 except Exception as e:
#                     st.error(f"Error deleting post: {e}")
        
#         with col3:
#             # Image generation button and custom prompt
#             image_prompt = st.text_input(
#                 "Image prompt (optional)", 
#                 value=f"{post['title']} - {post['description']}", 
#                 key=f"image_prompt_{i}"
#             )
            
#             if st.button("Generate Image", key=f"generate_image_{i}"):
#                 try:
#                     # Use post_id for image generation and mapping
#                     result = generate_image_for_blog(post_id, image_prompt)
#                     st.success(f"Image generation started: {result}")
#                     # Store the post ID in session state to track which blog has a pending image
#                     st.session_state[f"pending_image_{i}"] = post_id
#                     # Force a rerun to check if image is available (might take a moment)
#                     time.sleep(2)  # Wait briefly for image generation
#                     st.rerun()
#                 except Exception as e:
#                     st.error(f"Error generating image: {e}")
            
#             # Check if this blog has an image already
#             existing_image = get_blog_image(post_id)
            
#             if existing_image:
#                 st.success(f"Image available: {os.path.basename(existing_image)}")
                
#                 # Handle both absolute and relative paths
#                 if existing_image.startswith("images/"):
#                     # Relative path - convert to absolute
#                     image_path = os.path.join(COSMI_BLOGS_DIR, "assets", existing_image)
#                 else:
#                     # Already absolute
#                     image_path = existing_image
                
#                 # Check if file exists and display
#                 if os.path.exists(image_path):
#                     st.image(image_path, width=200)
#                     # Store the image path in session state for publishing
#                     st.session_state[f"image_path_{i}"] = existing_image
#                 else:
#                     st.warning(f"Image file not found at {image_path}")
                    
#         with col4:
#             uploaded_file = st.file_uploader("Upload Image", key=f"image_{i}", type=["png", "jpg", "jpeg"])
#             if uploaded_file:
#                 # Save the image and store its path in session state
#                 image_path = handle_image_upload(uploaded_file)
#                 if image_path:
#                     st.session_state[f"image_path_{i}"] = image_path
#                     st.success("Image uploaded successfully!")
#                     st.image(os.path.join(COSMI_BLOGS_DIR, "assets", image_path), width=200)
                
#             if st.button("Publish Now", key=f"publish_{i}"):
#                 try:
#                     # Get previously uploaded or generated image path from session state
#                     image_path = st.session_state.get(f"image_path_{i}", None)
                    
#                     # If no manually uploaded image, check if we have a generated one
#                     if not image_path:
#                         image_path = get_blog_image(post_id)
                    
#                     # Generate and save the markdown file
#                     md_filepath = publish_to_cosmi_blogs(post, image_path)
#                     # Get just the filename for commit message
#                     filename = os.path.basename(md_filepath)
                    
#                     import subprocess, pathlib

#                     script = pathlib.Path(__file__).parent / "run.sh"
#                     # Set this once in your environment or at the start of your program
#                     # os.environ['BASH_PATH'] = r"C:\Program Files\Git\bin\bash.exe"

#                     # # Then use it
#                     # bash_path = os.environ.get('BASH_PATH', 'bash')
#                     # Use bash explicitly to run the shell script on Windows
#                     commit_msg = filename.replace(".md", "")
#                     result = subprocess.run(
#                         [ str(script), f"{commit_msg}"],
#                         check=True,
#                     )
#                     st.success(f"Published {filename} successfully!")
#                 except Exception as e:
#                     st.error(f"Error publishing post: {e}")
#                     st.error("Exception details: " + str(e.__class__.__name__) + ": " + str(e))

# def load_blog_posts_from_supabase(project_id: str = None, author_id: str = None):
#     """
#     Loads blog posts from the Supabase database.
    
#     Args:
#         project_id: Optional project ID to filter by
#         author_id: Optional author ID to filter by
        
#     Returns:
#         A list of blog post dictionaries
#     """
#     try:
#         # Get Supabase client
#         supabase = get_supabase_client()
        
#         # Build the query
#         query = supabase.client.table("blog_posts").select("*")
        
#         # Add filters if provided
#         if project_id:
#             query = query.eq("project_id", project_id)
#         if author_id:
#             query = query.eq("author_id", author_id)
            
#         # Execute the query
#         response = query.execute()
        
#         # Parse the results
#         blog_posts = []
#         for blog_post_data in response.data:
#             # Extract the content (which is in markdown format)
#             content = blog_post_data.get("content", "")
            
#             # Parse frontmatter and content
#             if content.startswith("---"):
#                 # Find the end of frontmatter
#                 end_frontmatter = content.find("---", 3)
#                 if end_frontmatter != -1:
#                     frontmatter = content[3:end_frontmatter].strip()
#                     body = content[end_frontmatter+3:].strip()
                    
#                     # Parse YAML frontmatter
#                     try:
#                         if yaml:
#                             metadata = yaml.safe_load(frontmatter)
#                         else:
#                             # Use fallback parser if PyYAML isn't available
#                             metadata = parse_frontmatter(frontmatter)
                            
#                         post = {
#                             'title': metadata.get('title', blog_post_data.get('title', '')),
#                             'description': metadata.get('description', ''),
#                             'tags': metadata.get('tags', []),
#                             'categories': metadata.get('categories', []),
#                             'body': body,
#                             '_db_id': blog_post_data.get('id'),
#                             '_project_id': blog_post_data.get('project_id'),
#                             '_status': blog_post_data.get('status'),
#                             '_created_at': blog_post_data.get('created_at')
#                         }
#                         blog_posts.append(post)
#                     except Exception as e:
#                         st.error(f"Error parsing YAML frontmatter for blog post {blog_post_data.get('id')}: {e}")
#                 else:
#                     # No frontmatter, just use the content as body
#                     post = {
#                         'title': blog_post_data.get('title', ''),
#                         'description': '',
#                         'tags': [],
#                         'categories': [],
#                         'body': content,
#                         '_db_id': blog_post_data.get('id'),
#                         '_project_id': blog_post_data.get('project_id'),
#                         '_status': blog_post_data.get('status'),
#                         '_created_at': blog_post_data.get('created_at')
#                     }
#                     blog_posts.append(post)
#             else:
#                 # No frontmatter, just use the content as body
#                 post = {
#                     'title': blog_post_data.get('title', ''),
#                     'description': '',
#                     'tags': [],
#                     'categories': [],
#                     'body': content,
#                     '_db_id': blog_post_data.get('id'),
#                     '_project_id': blog_post_data.get('project_id'),
#                     '_status': blog_post_data.get('status'),
#                     '_created_at': blog_post_data.get('created_at')
#                 }
#                 blog_posts.append(post)
        
#         st.info(f"Loaded {len(blog_posts)} blog posts from the database.")
#         return blog_posts
#     except Exception as e:
#         st.error(f"Error loading blog posts from database: {e}")
#         return []
