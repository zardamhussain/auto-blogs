from fastapi import APIRouter, Depends, HTTPException
from ..dependencies import get_data_service
from ..services.supabase_service import SupabaseDataService

router = APIRouter(
    prefix="/debug",
    tags=["Debug"],
)

@router.get("/create-invitations-table")
def create_invitations_table(db: SupabaseDataService = Depends(get_data_service)):
    """
    A temporary endpoint to create the project_invitations table.
    """
    try:
        # This is a raw SQL query executed via the Supabase client.
        # It's not the standard way of doing things, but it's useful for a one-off task.
        query = """
        CREATE TABLE project_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES blog_projects(id) ON DELETE CASCADE,
            email_to VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            token VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) NOT NULL,
            invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        """
        db.supabase.rpc('eval', {'query': query}).execute()
        return {"message": "Successfully created the 'project_invitations' table."}
    except Exception as e:
        # The table might already exist, which is fine.
        if "already exists" in str(e):
            return {"message": "Table 'project_invitations' already exists."}
        raise HTTPException(status_code=500, detail=f"Failed to create table: {str(e)}") 