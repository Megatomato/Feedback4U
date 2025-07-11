from sqlalchemy import (
    PrimaryKeyConstraint,
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    DECIMAL,
    Text,
    ForeignKeyConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime
import os
from typing import Optional, List

# Database setup
PORT = os.getenv("DB_PORT", "8081")
USER = os.getenv("DB_USER", "postgres")
PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DATABASE = os.getenv("DB_DATABASE", "postgres")

DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@localhost:{PORT}/{DATABASE}"
engine = create_engine(
    DATABASE_URL,
    pool_size=int(os.getenv("DB_POOL_SIZE", 5)),
)
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
    student_id = Column(Integer, primary_key=True, autoincrement=True)
    school_student_id = Column(Integer, nullable=False)
    school_admin_id = Column(Integer, ForeignKey("admin.admin_id"), nullable=False)
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
    assignment_status = Column(String(50), default="active")
    assignment_course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class SubmittedAssignment(Base):
    __tablename__ = "submitted_assignments"
    submission_id = Column(Integer, primary_key=True, autoincrement=True)
    submitted_assignment_student_id = Column(
        Integer, ForeignKey("students.student_id"), nullable=False
    )
    submitted_assignment_assignment_id = Column(
        Integer, ForeignKey("assignments.assignment_id"), nullable=False
    )
    submission_status = Column(String(50), default="submitted")
    ai_feedback = Column(Text)
    ai_grade = Column(ARRAY(DECIMAL(5, 2)))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)


# Pydantic schemas
class TeacherCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    school_admin_id: int


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    school_student_id: int
    school_admin_id: int


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


class UserMeResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    school_admin_id: Optional[int] = None
    school_name: Optional[str] = None
    
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


class CourseCreate(BaseModel):
    course_name: str
    course_description: str
    course_teacher_id: int


class CourseResponse(BaseModel):
    course_id: int
    course_name: str
    course_description: str
    course_is_active: bool
    course_teacher_id: int

    class Config:
        from_attributes = True


class AssignmentCreate(BaseModel):
    assignment_name: str
    assignment_description: str
    assignment_due_date: datetime
    assignment_course_id: int


class AssignmentResponse(BaseModel):
    assignment_id: int
    assignment_name: str
    assignment_description: str
    assignment_due_date: datetime
    assignment_status: str
    assignment_course_id: int

    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    submission_id: int
    submitted_assignment_student_id: int
    submitted_assignment_assignment_id: int
    submission_status: str
    ai_feedback: Optional[str] = None
    ai_grade: Optional[List[float]] = None
    uploaded_at: datetime
    graded_at: Optional[datetime] = None

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
