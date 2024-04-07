from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    fullname = Column(String, index=True)
    bio = Column(String, index=True)
    face_encodings = Column(JSON)

    sessions = relationship("Session", back_populates="user")
