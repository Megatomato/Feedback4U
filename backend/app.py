from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import PrimaryKeyConstraint, create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from typing import Optional, List

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://rag_user:super_secure_pw@localhost:5433/rag_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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
    student_id = Column(Integer, nullable=False)
    school_student_id = Column(Integer, nullable=False)
    student_email = Column(String(255), unique=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    student_phone_number = Column(String(255), nullable=False)
    student_password_hash = Column(String(255), nullable=False)
    student_average_grade = Column(Integer, nullable=False)
    student_is_studying = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (PrimaryKeyConstraint('student_id', 'school_student_id', name='pk_student'),)

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

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    
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

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if user_type == "student":
        user = db.query(Student).filter(Student.student_id == int(user_id)).first()
    elif user_type == "teacher":
        user = db.query(Teacher).filter(Teacher.teacher_id == int(user_id)).first()
    elif user_type == "admin":
        user = db.query(Admin).filter(Admin.admin_id == int(user_id)).first()
    else:
        raise credentials_exception
        
    if user is None:
        raise credentials_exception
    return user

# API Routes
@app.get("/")
async def root():
    return {"message": "Feedback4U API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Authentication routes
@app.post("/auth/register/admin", response_model=AdminResponse)
async def register_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(Admin).filter(Admin.admin_email == admin.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Map plan to subscription details
    plan_mapping = {
        'sml': {
            'type': 'Home School Package',
            'price': 9.99,
            'features': '1 Teacher, 4 Classes per Teacher, Up to 10 Students per Class'
        },
        'mid': {
            'type': 'Mid Sized School', 
            'price': 59.99,
            'features': 'Up to 100 Teachers, Up to 4 Classes per Teacher, Up to 35 Students per Class'
        },
        'lrg': {
            'type': 'Large School / University',
            'price': 694.20,
            'features': 'Up to 250 Teachers, Up to 6 Classes per Teacher, Up to 250 per Class'
        }
    }
    
    plan_details = plan_mapping.get(admin.plan, plan_mapping['mid'])  # Default to mid plan
    
    # Create subscription dates
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=30)  # 30-day trial
    renewal_date = end_date
    
    db_admin = Admin(
        school_name=admin.school_name,
        admin_email=admin.email,
        admin_name=admin.admin_name,
        admin_password_hash=get_password_hash(admin.password),
        admin_phone_number=admin.admin_phone_number,
        subscription_type=plan_details['type'],
        subscription_start_date=start_date,
        subscription_end_date=end_date,
        subscription_status='trial',  # Start with trial
        subscription_renewal_date=renewal_date,
        subscription_renewal_status='pending',
    )
    
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    
    return AdminResponse(
        admin_id=db_admin.admin_id,
        school_name=db_admin.school_name,
        admin_email=db_admin.admin_email,
        admin_name=db_admin.admin_name,
        subscription_type=db_admin.subscription_type,
        subscription_status=db_admin.subscription_status
    )

@app.post("/auth/register/student", response_model=UserResponse)
async def register_student(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(Student).filter(Student.student_email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_student = Student(
        student_email=user.email,
        student_name=user.name,
        student_phone_number=user.phone_number,
        student_password_hash=get_password_hash(user.password),
        student_average_grade=0,
        student_is_studying=True,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return UserResponse(
        id=db_student.student_id,
        email=db_student.student_email,
        name=db_student.student_name
    )

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try to find user in each table
    user = None
    user_type = None
    user_id = None
    
    # Check students
    student = db.query(Student).filter(Student.student_email == form_data.username).first()
    if student and verify_password(form_data.password, student.student_password_hash):
        user = student
        user_type = "student"
        user_id = student.student_id
    
    # Check teachers
    if not user:
        teacher = db.query(Teacher).filter(Teacher.teacher_email == form_data.username).first()
        if teacher and verify_password(form_data.password, teacher.teacher_password_hash):
            user = teacher
            user_type = "teacher"
            user_id = teacher.teacher_id
    
    # Check admins
    if not user:
        admin = db.query(Admin).filter(Admin.admin_email == form_data.username).first()
        if admin and verify_password(form_data.password, admin.admin_password_hash):
            user = admin
            user_type = "admin"
            user_id = admin.admin_id
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id), "type": user_type},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Protected routes
@app.get("/students", response_model=List[StudentResponse])
async def get_students(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students

@app.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers

@app.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)