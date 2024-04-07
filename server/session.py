from fastapi import Depends, HTTPException, status, WebSocket, Request
from sqlalchemy.orm import Session as SQLSession
from models.session import Session
from config import SessionLocal
from models.user import User
import secrets
from typing import Optional
from datetime import datetime, timedelta


def create_session_token() -> str:
    return secrets.token_urlsafe()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user_session(user: User, db: SQLSession, session_duration: int = 120):
    # Create a session token and store it in the database
    session_token = create_session_token()
    expiration_time = datetime.utcnow() + timedelta(seconds=session_duration)
    new_session = Session(
        user_id=user.id, session_token=session_token, expiration=expiration_time
    )
    db.add(new_session)
    db.commit()
    return session_token


def verify_user_session(request: Request, db: SQLSession) -> Optional[User]:
    # Extract session token from cookies
    session_token = request.cookies.get("session_token")
    if not session_token:
        return None

    try:
        session = (
            db.query(Session)
            .filter(
                Session.session_token == session_token,
                Session.expiration
                > datetime.utcnow(),  # Assuming expiration is a datetime
            )
            .first()
        )

        if session:
            return db.query(User).filter(User.id == session.user_id).first()
        return None
    except Exception as e:
        # Handle or log the exception as appropriate
        print(f"Error verifying user session: {str(e)}")
        return None


def invalidate_user_session(request: Request, db: SQLSession) -> bool:
    try:
        # Assuming the session token is stored in a cookie
        session_token = request.cookies.get("session_token")
        if session_token:
            db.query(Session).filter(Session.session_token == session_token).delete()
            db.commit()
            return True
        return False
    except Exception as e:
        # Log the exception here if needed
        return False


def get_current_user(request: Request, db: SQLSession = Depends(get_db)) -> User:
    # Verify the session and retrieve the user associated with it
    user = verify_user_session(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return user
