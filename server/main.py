from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from face_recognition import load_image_file, face_encodings, face_landmarks, face_locations, compare_faces
import numpy as np
import bcrypt
import base64
from typing import List
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session as SQLSession
from config import SessionLocal
from models.user import User
from models.session import Session
from pydantic import BaseModel
from session import create_user_session, get_current_user, invalidate_user_session
from datetime import datetime

app = FastAPI()


# Add CORS middleware to allow connections from your React application's domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # You can use ["*"] for development only!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    face_encoding: str


class TokenRequest(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    username: str
    fullname: str
    bio: str
    face_encodings: List[str]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Hello World!"}


# @app.post("/register")
# def register(request: RegisterRequest, db: SQLSession = Depends(get_db)):
#     user = User(username=request.username, fullname=request.fullname, bio=request.bio)
#     db.add(user)
#     db.commit()
#     return {"message": "User created successfully."}


# @app.post("/login")
# def login(request: LoginRequest, db: SQLSession = Depends(get_db)):
#     user = db.query(User).filter(User.username == request.username).first()
#     if not user:
#         raise HTTPException(status_code=400, detail="Incorrect username")
#     return {"message": "User authenticated successfully"}


@app.post("/face-auth")
async def face_auth(request: LoginRequest, db: SQLSession = Depends(get_db)):
    # Retrieve user by username
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Decode the face encoding from base64 to an image array
    image_data = safe_b64decode(request.face_encoding)
    face_image = load_image_file(BytesIO(image_data))
    face_encodings_in_image = face_encodings(face_image)

    if len(face_encodings_in_image) == 0:
        raise HTTPException(status_code=400, detail="No faces detected in the image.")

    # Check if the provided face encoding matches any of the stored encodings
    is_verified = any(
        compare_faces(
            [np.array(encoding) for encoding in user.face_encodings],
            face_encodings_in_image[0],
            tolerance=0.6,
        )
    )

    if is_verified:
        session_token = create_user_session(user, db)
        response = JSONResponse(content={"message": "Successful login."})
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite='Lax')
        return response
    else:
        raise HTTPException(status_code=401, detail="Facial Biometrics failed. Retry!")


def safe_b64decode(image_data: str) -> bytes:
    # Remove metadata if present
    if image_data.startswith("data:image/jpeg;base64,"):
        image_data = image_data.replace("data:image/jpeg;base64,", "")
    elif image_data.startswith("data:image/png;base64,"):
        image_data = image_data.replace("data:image/png;base64,", "")

    # Ensure padding is correct
    padding = len(image_data) % 4
    if padding:
        image_data += "=" * (4 - padding)
    try:
        return base64.b64decode(image_data)
    except binascii.Error as e:
        print(f"Decoding error: {e}")
        return None


@app.post("/face-register")
async def face_register(
    request: RegisterRequest, db: SQLSession = Depends(get_db)
):  # Check if user already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        # User already exists, no need to proceed
        return {
            "message": f"User {request.username} is already registered. Proceed to login."
        }

    # User doesn't exist, proceed with registration
    if len(request.face_encodings) != 5:
        raise HTTPException(status_code=400, detail="Exactly 5 images are required.")

    # db = SessionLocal()
    user = User(username=request.username, fullname=request.fullname, bio=request.bio, face_encodings=[])
    db.add(user)

    # for i, image_data in enumerate(request.face_encodings):
    #     image_bytes = safe_b64decode(image_data)
    #     if image_bytes:
    #         with open(f"test_image_{i}.jpeg", "wb") as f:
    #             f.write(image_bytes)

    for index, image_data in enumerate(request.face_encodings):
        image_bytes = safe_b64decode(image_data)
        if image_bytes is None:
            db.rollback()
            raise HTTPException(
                status_code=400, detail="Invalid base64 encoding inimage {index + 1}."
            )

        try:
            image = Image.open(BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except UnidentifiedImageError:
            db.rollback()
            raise HTTPException(
                status_code=422,
                detail=f"Cannot identify image {index + 1}. Ensure the image is valid and supported.",
            )

        image_array = np.array(image)
        encodings = face_encodings(image_array)

        if len(encodings) == 0:
            db.rollback()  # Roll back the transaction if any image is invalid
            raise HTTPException(
                status_code=422,
                detail=f"No faces detected in image {index + 1}. Please ensure the image clearly shows a face.",
            )

        # Assuming we only take the first encoding for simplicity
        user.face_encodings.append(
            encodings[0].tolist()
        )  # Convert numpy array to list for JSON serialization

    db.commit()  # Commit the transaction
    return {"message": "Faces registered for user {}".format(request.username)}


@app.post("/logout")
def logout(request: Request, db: SQLSession = Depends(get_db)):
    if not invalidate_user_session(request, db):
        raise HTTPException(status_code=500, detail="Failed to invalidate session.")
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="session_token")
    return response


@app.post("/user-data")
def get_user_data(current_user: User = Depends(get_current_user)):
    try:
        # Attempt to construct the user data response
        user_data_response = {
            "message": f"Welcome, {current_user.username}!",
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "fullname": current_user.fullname,
                "bio": current_user.bio,
            },
        }
        return user_data_response
    except Exception as e:
        # Handle unexpected exceptions
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@app.post("/validate-token")
def validate_token(request: Request, db: SQLSession = Depends(get_db)):
    # Check if the token is valid
    session = db.query(Session).filter(Session.session_token == request.cookies.get("session_token")).first()
    if session and session.expiration > datetime.utcnow():
        return {"isValid": True}
    return {"isValid": False}
