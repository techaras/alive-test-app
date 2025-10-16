from fastapi import Request
from fastapi.responses import RedirectResponse
from config import workos, WORKOS_COOKIE_PASSWORD


def with_auth(request: Request):
    """
    Dependency to check if the user is authenticated.
    If not, redirect to login or attempt session refresh.
    
    Returns:
        dict: {"session": session, "user": user} if authenticated
        RedirectResponse: Redirect to signin if not authenticated
    """
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=WORKOS_COOKIE_PASSWORD,
    )
    auth_response = session.authenticate()
    
    if auth_response.authenticated:
        return {"session": session, "user": auth_response.user}

    if (
        auth_response.authenticated is False
        and auth_response.reason == "no_session_cookie_provided"
    ):
        return RedirectResponse(url="/signin")

    # If no session, attempt a refresh
    try:
        print("Refreshing session")
        result = session.refresh()
        if result.authenticated is False:
            return RedirectResponse(url="/signin")

        response = RedirectResponse(url=str(request.url))
        response.set_cookie(
            key="wos_session",
            value=result.sealed_session,
            secure=True,
            httponly=True,
            samesite="lax",
        )
        return response
    except Exception as e:
        print("Error refreshing session", e)
        response = RedirectResponse(url="/signin")
        response.delete_cookie("wos_session")
        return response