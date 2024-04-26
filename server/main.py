from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from face_recognition import load_image_file, face_encodings, face_landmarks, face_locations, compare_faces
import numpy as np
import os
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
from sqlalchemy import func


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
    # username: str
    student_id: str
    matriculation_number: str
    face_encoding: str


class TokenRequest(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    # username: str
    # fullname: str
    # bio: str
    student_id: str
    matriculation_number: str
    firstname: str
    middlename: str
    lastname: str
    date_of_birth: str
    email: str
    phone_number: str
    faculty: str
    department: str
    level: str
    academic_session: str
    face_encodings: List[str]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# @app.get("/")
# def home():
#     return {"message": "Hello World!"}


def verify_face_encoding(
    user_encodings, incoming_encoding, tolerance=0.4, required_matches=3
):
    # Convert user encodings from a list of lists to a list of numpy arrays
    known_encodings = [np.array(encoding) for encoding in user_encodings]

    # Compare the incoming face encoding against each of the known encodings
    comparison_results = compare_faces(
        known_encodings, incoming_encoding, tolerance=tolerance
    )

    # Count the number of True results indicating a match
    match_count = sum(comparison_results)

    # Check if the number of matches meets the required threshold
    return match_count >= required_matches


def process_image_and_verify(request, user):
    # Decode the face encoding from base64 to an image array
    image_data = safe_b64decode(request.face_encoding)
    face_image = load_image_file(BytesIO(image_data))
    face_encodings_in_image = face_encodings(face_image)

    if len(face_encodings_in_image) == 0:
        raise HTTPException(status_code=400, detail="No faces detected in the image.")

    # Initialize verification status
    is_verified = False

    # Check each detected face encoding against the stored user encodings
    for incoming_encoding in face_encodings_in_image:
        if verify_face_encoding(user.face_encodings, incoming_encoding):
            is_verified = True
            break  # Stop checking if a match is found

    return is_verified


@app.post("/face-auth")
async def face_auth(request: LoginRequest, db: SQLSession = Depends(get_db)):
    # Retrieve user by student_id
    user = (
        db.query(User)
        .filter(
            func.lower(User.student_id) == func.lower(request.student_id),
            func.lower(User.matriculation_number)
            == func.lower(request.matriculation_number),
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Decode the face encoding from base64 to an image array
    image_data = safe_b64decode(request.face_encoding)
    face_image = load_image_file(BytesIO(image_data))
    face_encodings_in_image = face_encodings(face_image)

    if len(face_encodings_in_image) == 0:
        raise HTTPException(status_code=400, detail="No faces detected in the image.")

    # Check if the provided face encoding matches any of the stored encodings
    is_verified = process_image_and_verify(request, user)

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
    except Exception as e:
        print(f"Decoding error: {e}")
        return None


@app.post("/face-register")
async def face_register(
    request: RegisterRequest, db: SQLSession = Depends(get_db)
):  # Check if user already exists
    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.student_id) == func.lower(request.student_id),
            func.lower(User.matriculation_number)
            == func.lower(request.matriculation_number),
        )
        .first()
    )

    if existing_user:
        # User already exists, no need to proceed
        return {
            "message": f"{request.student_id} is already registered. Proceed to login."
        }

    # User doesn't exist, proceed with registration
    if len(request.face_encodings) != 5:
        raise HTTPException(status_code=400, detail="Exactly 5 images are required.")

    # db = SessionLocal()

    # Prepare the directory for storing images
    image_directory = f"./../client/src/assets/user/{request.student_id}"
    if not os.path.exists(image_directory):
        os.makedirs(image_directory)

    user = User(
        student_id=request.student_id,
        matriculation_number=request.matriculation_number,
        firstname=request.firstname,
        lastname=request.lastname,
        date_of_birth=request.date_of_birth,
        email=request.email,
        phone_number=request.phone_number,
        faculty=request.faculty,
        department=request.department,
        level=request.level,
        academic_session=request.academic_session,
        face_encodings=[]
    )

    db.add(user)

    # Process and store the first image as the passport photo with padding
    image_data = request.face_encodings[0]
    image_bytes = safe_b64decode(image_data)
    if image_bytes:
        try:
            face_image = crop_image_with_padding(image_bytes, padding_percentage=0.5)
            face_path = os.path.join(
                image_directory, f"passport.jpg"
            )
            face_image.save(face_path)
            user.passport = face_path  # Store the path in the database
        except ValueError as e:
            db.rollback()
            raise HTTPException(status_code=422, detail=str(e))

    for index, image_data in enumerate(request.face_encodings):
        image_bytes = safe_b64decode(image_data)
        if image_bytes is None:
            db.rollback()
            raise HTTPException(
                status_code=400, detail="Invalid base64 encoding in image {index + 1}."
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
    return {"message": "Faces registered for user {}".format(user.student_id)}


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
            "message": f"Welcome, {current_user.firstname}!",
            "user": {
                "id": current_user.id,
                "student_id": current_user.student_id,
                "firstname": current_user.firstname,
                "middlename": current_user.middlename,
                "lastname": current_user.lastname,
                # "bio": current_user.bio,
                "date_of_birth": current_user.date_of_birth,
                "email": current_user.email,
                "phone_number": current_user.phone_number,
                "faculty": current_user.faculty,
                "department": current_user.department,
                "level": current_user.level,
                "academic_session": current_user.academic_session,
                "passport": current_user.passport
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


@app.get("/test")
def test_endpoint(db: Session = Depends(get_db)):
    return db.query(User).first()


def crop_image_with_padding(image_bytes, padding_percentage=0.2):
    """
    Crops an image to include the face with a padding around it.

    Args:
    image_bytes (bytes): The image data in bytes.
    padding_percentage (float): The percentage of padding relative to the detected face dimensions.

    Returns:
    Image: The cropped image with padding.
    """
    if image_bytes:
        image = Image.open(BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        img_array = np.array(image)
        faces = face_locations(img_array)

        if faces:
            # Take the first detected face
            top, right, bottom, left = faces[0]

            # Calculate padding
            face_height = bottom - top
            face_width = right - left
            padding_height = int(face_height * padding_percentage)
            padding_width = int(face_width * padding_percentage)

            # Apply padding
            padded_top = max(0, top - padding_height)
            padded_bottom = min(img_array.shape[0], bottom + padding_height)
            padded_left = max(0, left - padding_width)
            padded_right = min(img_array.shape[1], right + padding_width)

            # Crop the image with padding
            face_image = image.crop(
                (padded_left, padded_top, padded_right, padded_bottom)
            )
            return face_image

        else:
            raise ValueError("No faces detected in the image.")
    else:
        raise ValueError("Invalid image bytes.")
