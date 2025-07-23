import os
import time
import praw
import logging
import threading
import concurrent.futures
import google.generativeai as genai
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv
from ..db.constants import gemini_model_type
# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RedditService:
    def __init__(self):
        """
        Initialize the Reddit Service with API credentials.
        """
        load_dotenv(dotenv_path="backend/.env")
        
        # Reddit Credentials
        self.reddit_credentials = self._load_reddit_credentials()
        
        # Initialize Gemini for keyword extraction
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment variables.")
        genai.configure(api_key=self.gemini_api_key)
        self.gemini_model = genai.GenerativeModel(gemini_model_type)

        # Initialize Reddit clients
        self.reddit_clients = self._initialize_reddit_clients()
        self.current_reddit_client_index = 0
        self.reddit_client_lock = threading.Lock()

    def _load_reddit_credentials(self) -> list:
        """Loads multiple sets of Reddit credentials from .env file."""
        credentials = []
        i = 1
        while True:
            client_id = os.getenv(f"REDDIT_CLIENT_ID_{i}")
            client_secret = os.getenv(f"REDDIT_CLIENT_SECRET_{i}")
            user_agent = os.getenv(f"REDDIT_USER_AGENT_{i}")
            username = os.getenv(f"REDDIT_USERNAME_{i}")
            password = os.getenv(f"REDDIT_PASSWORD_{i}")

            if all([client_id, client_secret, user_agent, username, password]):
                credentials.append({
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "user_agent": user_agent,
                    "username": username,
                    "password": password,
                })
                i += 1
            else:
                break
        
        if not credentials:
            logger.warning("No Reddit credentials found. Please check your .env file for REDDIT_CLIENT_ID_1, etc.")
        
        return credentials

    def _initialize_reddit_clients(self) -> list:
        clients = []
        if not self.reddit_credentials:
            logger.warning("Warning: No Reddit credentials provided.")
            return clients

        for creds in self.reddit_credentials:
            try:
                client = praw.Reddit(**creds)
                if client.user.me():
                    logger.info(f"Initialized and authenticated Reddit client for user: {creds['username']}")
                    clients.append(client)
                else:
                    logger.warning(f"Failed to authenticate Reddit client for user: {creds['username']}")
            except Exception as e:
                logger.error(f"Failed to initialize Reddit client for {creds.get('username', 'unknown')}: {e}")
        
        if not clients:
            logger.warning("Warning: No valid Reddit clients could be initialized.")
        return clients

    def _get_next_reddit_client(self):
        if not self.reddit_clients:
            return None
        
        with self.reddit_client_lock:
            client = self.reddit_clients[self.current_reddit_client_index]
            self.current_reddit_client_index = (self.current_reddit_client_index + 1) % len(self.reddit_clients)
            return client

    def _get_relevant_subreddits_from_llm(self, user_query: str, top_n: int = 3) -> List[str]:
        """
        Uses a generative model to find the most relevant subreddits for a user query.
        """
        prompt = f"""
        You are an expert at navigating Reddit. Your task is to find the most relevant subreddits for a user's query. 
        Based on the following query, suggest the top {top_n} subreddits where a user could find personal stories, discussions, and recovery tips.

        Query: '{user_query}'

        Return ONLY a JSON list of subreddit names (without the 'r/' prefix). Do not include any other text, explanations, or formatting.
        For example, for the query 'phone addiction stories', you should return something like:
        ["nosurf", "digitalminimalism", "decidingtobebetter"]
        """
        try:
            response = self.gemini_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json")
            )
            subreddit_list = json.loads(response.text)
            
            # Basic validation to ensure we got a list of strings
            if isinstance(subreddit_list, list) and all(isinstance(s, str) for s in subreddit_list):
                logger.info(f"LLM suggested subreddits for '{user_query}': {subreddit_list}")
                return subreddit_list[:top_n]
            else:
                logger.warning(f"LLM returned an unexpected format: {subreddit_list}. Falling back.")
                return []

        except Exception as e:
            logger.error(f"Error getting subreddits from LLM: {e}. Falling back.")
            return []

    def _find_top_subreddits(self, user_query: str, top_n: int = 3) -> List[str]:
        """
        Finds the top N most relevant subreddits for a user query using an LLM.
        """
        return self._get_relevant_subreddits_from_llm(user_query, top_n)

    def _search_single_subreddit(self, query: str, subreddit_name: str, limit: int) -> List[Dict]:
        """Helper function to search a single subreddit."""
        reddit_client = self._get_next_reddit_client()
        if not reddit_client:
            logger.warning(f"Skipping Reddit search on r/{subreddit_name}: No client available.")
            return []
            
        logger.info(f"Searching Reddit for '{query}' in r/{subreddit_name}")
        
        try:
            subreddit = reddit_client.subreddit(subreddit_name)
            discussions = []
            for submission in subreddit.search(query, sort='relevance', limit=limit * 2):
                if submission.num_comments > 5 and not submission.over_18:
                    discussion = {
                        'source_subreddit': subreddit_name,
                        'title': submission.title,
                        'content': submission.selftext,
                        'comments': [comment.body for comment in submission.comments if hasattr(comment, 'body') and len(comment.body) > 30][:10],
                        'url': submission.url, # Add this line
                    }
                    if discussion['comments']:
                        discussions.append(discussion)
                if len(discussions) >= limit:
                    break
            return discussions
        except Exception as e:
            logger.error(f"Error fetching from r/{subreddit_name}: {e}")
            return []

    def get_reddit_knowledge_base(self, original_query: str, search_query: str, limit_per_subreddit: int = 2) -> List[Dict]:
        """
        Main public method to get Reddit data. 
        Finds relevant subreddits and fetches discussions from them.
        """
        top_subreddits = self._find_top_subreddits(search_query)
        if not top_subreddits:
            logger.warning("Could not find relevant subreddits.")
            return []

        all_discussions = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(top_subreddits)) as executor:
            future_to_subreddit = {
                executor.submit(self._search_single_subreddit, search_query, sub_name, limit_per_subreddit): sub_name 
                for sub_name in top_subreddits
            }
            for future in concurrent.futures.as_completed(future_to_subreddit):
                subreddit_name = future_to_subreddit[future]
                try:
                    discussions = future.result()
                    all_discussions.extend(discussions)
                    logger.info(f"Found {len(discussions)} discussions in r/{subreddit_name}.")
                except Exception as e:
                    logger.error(f"Error processing future for r/{subreddit_name}: {e}")
        
        logger.info(f"Found a total of {len(all_discussions)} relevant discussions across all subreddits.")
        return all_discussions