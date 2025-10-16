from fastapi import APIRouter, Request, Depends
from config import workos, WORKOS_COOKIE_PASSWORD
from dependencies import with_auth

router = APIRouter(tags=["users"])


@router.get("/dashboard")
def dashboard(request: Request, auth=Depends(with_auth)):
    """
    Protected dashboard endpoint.
    Returns user data if authenticated.
    """
    # If with_auth returns a RedirectResponse (not authenticated), FastAPI will return it
    # Otherwise, auth contains {"session": session, "user": user}
    
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=WORKOS_COOKIE_PASSWORD,
    )

    response = session.authenticate()

    current_user = response.user if response.authenticated else None

    print(f"User {current_user.first_name} is logged in")

    # Return user data as JSON (instead of rendering a view in FastAPI)
    return {
        "message": "Dashboard",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
        }
    }


@router.get("/api/me")
def get_current_user(request: Request):
    """
    Get current authenticated user information.
    Returns authentication status and user data if logged in.
    """
    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=request.cookies.get("wos_session"),
            cookie_password=WORKOS_COOKIE_PASSWORD,
        )
        auth_response = session.authenticate()
        
        if auth_response.authenticated:
            user = auth_response.user
            return {
                "authenticated": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            }
        else:
            return {"authenticated": False}
    except Exception as e:
        return {"authenticated": False}