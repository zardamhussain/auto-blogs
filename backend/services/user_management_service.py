from uuid import UUID
import logging
from firebase_admin import auth
from fastapi import Depends

from .base_data_service import BaseDataService
from ..dependencies import get_data_service
from ..models.user import User

logger = logging.getLogger(__name__)

class UserManagementService:
    def __init__(self, db_service: BaseDataService):
        self.db_service = db_service

    def deactivate_and_delete_user(self, user: User):
        """
        Deactivates a user in the local database and deletes them from Firebase Auth.
        """
        internal_id = user.id
        firebase_uid = user.external_id

        if not firebase_uid:
            # This should ideally not happen for an authenticated user.
            raise ValueError(f"User {internal_id} does not have an external Firebase UID.")

        try:
            # Step 1: Deactivate user in the application database
            logger.info(f"Deactivating user with internal ID: {internal_id}")
            success = self.db_service.deactivate_user(internal_id)
            if not success:
                # Log a warning but proceed to Firebase deletion
                logger.warning(f"User {internal_id} not found or already inactive in DB, but proceeding with Firebase deletion.")

            # Step 2: Delete user from Firebase Authentication using the correct Firebase UID
            logger.info(f"Deleting user from Firebase Authentication with UID: {firebase_uid}")
            auth.delete_user(firebase_uid)
            
            logger.info(f"Successfully deactivated and deleted user. Internal ID: {internal_id}, Firebase UID: {firebase_uid}")
            return True

        except auth.UserNotFoundError:
            logger.warning(f"User with Firebase UID {firebase_uid} not found in Firebase Authentication. They may have already been deleted.")
            # If the goal is to remove the user, and they're not in Firebase, we can consider this a success.
            return True
        except Exception as e:
            logger.error(f"An unexpected error occurred during account deletion for user {internal_id}: {e}")
            # Re-raise the exception to be caught by the API router for a 500 response
            raise e

def get_user_management_service(db_service: BaseDataService = Depends(get_data_service)) -> UserManagementService:
    return UserManagementService(db_service) 