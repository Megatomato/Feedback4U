from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
import os
from typing import Optional, List

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://feedback_user:feedback_password@localhost:5432/feedback4u")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="Feedback4U API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    student_email = Column(String(255), unique=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    student_phone_number = Column(String(255), nullable=False)
    student_password_hash = Column(String(255), nullable=False)
    student_average_grade = Column(Integer, nullable=False)
    student_is_studying = Column(Boolean, nullable=False)
    assigned_teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

# Pydantic schemas for API requests/responses
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

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API Routes
@app.get("/")
async def root():
    return {"message": "Feedback4U API is running"}

@app.get("/students", response_model=List[StudentResponse])
async def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students

@app.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers

@app.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student