from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    student_id = Column(String, unique=True)
    matriculation_number = Column(String, unique=True)
    firstname = Column(String)
    middlename = Column(String, nullable=True)
    lastname = Column(String)
    date_of_birth = Column(String)
    email = Column(String, unique=True)
    phone_number = Column(String)
    faculty = Column(String)
    department = Column(String)
    level = Column(String)
    academic_session = Column(String)
    passport = Column(String)  # String to store image data or a reference to the image path

    sessions = relationship("Session", back_populates="user")

    face_encodings = Column(JSON)
    