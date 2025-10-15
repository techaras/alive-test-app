from dotenv import load_dotenv
import os
from fastapi import FastAPI
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
        )
        
        # Use the information in auth_response for further business logic.
        
        # Redirect to frontend homepage
        return RedirectResponse(url="http://localhost:3000")
    
    except Exception as e:
        print("Error authenticating with code", e)
        return RedirectResponse(url="http://localhost:8000/signin")