import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path='backend/.env')

def get_client() -> Client:
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        raise ValueError("Supabase URL and Key must be set in environment variables.")
    
    return create_client(url, key)

# Singleton Supabase client (will be cached)
supabase_client = get_client()