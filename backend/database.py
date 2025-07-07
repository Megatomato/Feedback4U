from sqlalchemy import PrimaryKeyConstraint, create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime
import os
from typing import Optional, List

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://localhost:5432/feedback4u_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models (matching your schema)
class Admin(Base):
    __tablename__ = "admin"
    admin_id = Column(Integer, primary_key=True)
    school_name = Column(String(255), nullable=False)
    admin_email = Column(String(255), unique=True, nullable=False)
    admin_name = Column(String(255), nullable=False)
    admin_password_hash = Column(String(255), nullable=False)
    admin_phone_number = Column(String(255), nullable=False)
    subscription_type = Column(String(255), nullable=False)
    subscription_start_date = Column(DateTime, nullable=False)
    subscription_end_date = Column(DateTime, nullable=False)
    subscription_status = Column(String(255), nullable=False)
    subscription_renewal_date = Column(DateTime, nullable=False)
    subscription_renewal_status = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Teacher(Base):
    __tablename__ = "teachers"
    teacher_id = Column(Integer, primary_key=True)
    teacher_email = Column(String(255), unique=True, nullable=False)
    teacher_name = Column(String(255), nullable=False)
    teacher_phone_number = Column(String(255), nullable=False)
    teacher_password_hash = Column(String(255), nullable=False)
    teacher_is_active = Column(Boolean, nullable=False)
    school_admin_id = Column(Integer, ForeignKey("admin.admin_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"
    student_id = Column(Integer, primary_key=True)
    school_student_id = Column(Integer, primary_key=True, nullable=False)
    student_email = Column(String(255), unique=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    student_phone_number = Column(String(255), nullable=False)
    student_password_hash = Column(String(255), nullable=False)
    student_average_grade = Column(Integer, nullable=False)
    student_is_studying = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"
    course_id = Column(Integer, primary_key=True)
    course_name = Column(String(255), nullable=False)
    course_description = Column(String(255), nullable=False)
    course_is_active = Column(Boolean, nullable=False)
    course_teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"
    assignment_id = Column(Integer, primary_key=True)
    assignment_name = Column(String(255), nullable=False)
    assignment_description = Column(String(255), nullable=False)
    assignment_due_date = Column(DateTime, nullable=False)
    assignment_status = Column(String(50), default='active')
    assignment_course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

# Pydantic schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str

class AdminCreate(BaseModel):
    school_name: str
    email: EmailStr
    password: str
    admin_name: str
    admin_phone_number: str
    plan: str  # 'sml', 'mid', 'lrg'

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    
    class Config:
        from_attributes = True

class AdminResponse(BaseModel):
    admin_id: int
    school_name: str
    admin_email: str
    admin_name: str
    subscription_type: str
    subscription_status: str
    
    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    student_average_grade: int
    student_is_studying: bool
    
    class Config:
        from_attributes = True

class TeacherResponse(BaseModel):
    teacher_id: int
    teacher_name: str
    teacher_email: str
    teacher_is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 