from dotenv import load_dotenv
import os
from workos import WorkOSClient

load_dotenv()

# Environment variables
WORKOS_API_KEY = os.getenv("WORKOS_API_KEY")
WORKOS_CLIENT_ID = os.getenv("WORKOS_CLIENT_ID")
WORKOS_REDIRECT_URI = os.getenv("WORKOS_REDIRECT_URI")
WORKOS_COOKIE_PASSWORD = os.getenv("WORKOS_COOKIE_PASSWORD")

# Initialize WorkOS client
workos = WorkOSClient(
    api_key=WORKOS_API_KEY,
    client_id=WORKOS_CLIENT_ID
)