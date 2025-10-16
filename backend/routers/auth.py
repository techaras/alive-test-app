from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from config import workos, WORKOS_REDIRECT_URI, WORKOS_COOKIE_PASSWORD

router = APIRouter(tags=["authentication"])


@router.get("/signin")
def signin():
    """Redirect to WorkOS sign-in page"""
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=WORKOS_REDIRECT_URI,
        screen_hint="sign-in"
    )
    
    return RedirectResponse(url=authorization_url)


@router.get("/signup")
def signup():
    """Redirect to WorkOS sign-up page"""
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=WORKOS_REDIRECT_URI,
        screen_hint="sign-up"
    )
    
    return RedirectResponse(url=authorization_url)


@router.get("/callback")
def callback(code: str):
    """
    OAuth callback endpoint.
    Exchanges authorization code for user session.
    """
    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={"seal_session": True, "cookie_password": WORKOS_COOKIE_PASSWORD},
        )
        
        # Use the information in auth_response for further business logic.
        
        # Redirect to frontend dashboard
        response = RedirectResponse(url="http://localhost:3000/dashboard")
        
        # Store the session in a cookie
        response.set_cookie(
            key="wos_session",
            value=auth_response.sealed_session,
            secure=True,
            httponly=True,
            samesite="lax",
        )
        
        return response
    
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="http://localhost:8000/signin")


@router.get("/logout")
def logout(request: Request):
    """
    Log out the current user.
    Clears session cookie and redirects to WorkOS logout URL.
    """
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=WORKOS_COOKIE_PASSWORD,
    )
    url = session.get_logout_url()

    # After log out has succeeded, the user will be redirected to your
    # app homepage which is configured in the WorkOS dashboard
    response = RedirectResponse(url=url)
    response.delete_cookie("wos_session")

    return response