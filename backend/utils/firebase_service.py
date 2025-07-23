import firebase_admin
from firebase_admin import credentials, auth
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# --- Firebase Initialization ---
try:
    cred_path = os.getenv("FIREBASE_ADMIN_SDK_PATH", "firebase-admin.json")

    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase admin credentials not found at {cred_path}.")

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    
except Exception as e:
    logger.error(f"Error initializing Firebase Admin SDK: {e}")

def verify_firebase_token(token: str) -> Optional[dict]:
    try:
        decoded_token = auth.verify_id_token(token,clock_skew_seconds=10)
        return decoded_token
    except auth.ExpiredIdTokenError:
        print("Firebase ID token has expired.")
        return None
    except Exception as e:
        logger.error(f"Error verifying Firebase ID token: {e}")
        return None
