from dotenv import load_dotenv
import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from workos import WorkOSClient

load_dotenv()

app = FastAPI()

# Enable CORS so Next.js can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WorkOS client
workos = WorkOSClient(
    api_key=os.getenv("WORKOS_API_KEY"), 
    client_id=os.getenv("WORKOS_CLIENT_ID")
)

cookie_password = os.getenv("WORKOS_COOKIE_PASSWORD")


# Dependency to check if the user is authenticated. If not, redirect to login
def with_auth(request: Request):
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=cookie_password,
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


@app.get("/health")
def liveness_check():
    return {"status": "alive", "service": "FastAPI"}


@app.get("/signin")
def signin():
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit", 
        redirect_uri=os.getenv("WORKOS_REDIRECT_URI"),
        screen_hint="sign-in"
    )
    
    return RedirectResponse(url=authorization_url)


@app.get("/signup")
def signup():
    authorization_url = workos.user_management.get_authorization_url(
        provider="authkit", 
        redirect_uri=os.getenv("WORKOS_REDIRECT_URI"),
        screen_hint="sign-up"
    )
    
    return RedirectResponse(url=authorization_url)


@app.get("/callback")
def callback(code: str):
    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={"seal_session": True, "cookie_password": cookie_password},
        )
        
        # Use the information in auth_response for further business logic.
        
        # Redirect to frontend homepage
        response = RedirectResponse(url="http://localhost:3000")
        
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
    

@app.get("/dashboard")
def dashboard(request: Request, auth = Depends(with_auth)):
    # If with_auth returns a RedirectResponse (not authenticated), FastAPI will return it
    # Otherwise, auth contains {"session": session, "user": user}
    
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=cookie_password,
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
    
@app.get("/logout")
def logout(request: Request):
    session = workos.user_management.load_sealed_session(
        sealed_session=request.cookies.get("wos_session"),
        cookie_password=cookie_password,
    )
    url = session.get_logout_url()

    # After log out has succeeded, the user will be redirected to your
    # app homepage which is configured in the WorkOS dashboard
    response = RedirectResponse(url=url)
    response.delete_cookie("wos_session")

    return response