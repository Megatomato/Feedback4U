from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import httpx
import json
from typing import Optional, List
import uvicorn
import database

# Import database models and schemas
from database import (
    Admin,
    Teacher,
    Student,
    Course,
    Assignment,
    SubmittedAssignment,
    UserCreate,
    TeacherCreate,
    AdminCreate,
    UserResponse,
    AdminResponse,
    StudentResponse,
    TeacherResponse,
    CourseCreate,
    CourseResponse,
    AssignmentCreate,
    AssignmentResponse,
    SubmissionResponse,
    Token,
    get_db,
)

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-productionx")
PORT = os.getenv("PORT", "8000")
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
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection with a simple query
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


# Authentication routes
@app.post("/auth/register/admin", response_model=AdminResponse)
async def register_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(Admin).filter(Admin.admin_email == admin.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Map plan to subscription details
    plan_mapping = {
        "sml": {
            "type": "Home School Package",
            "price": 9.99,
            "features": "1 Teacher, 4 Classes per Teacher, Up to 10 Students per Class",
        },
        "mid": {
            "type": "Mid Sized School",
            "price": 59.99,
            "features": "Up to 100 Teachers, Up to 4 Classes per Teacher, Up to 35 Students per Class",
        },
        "lrg": {
            "type": "Large School / University",
            "price": 694.20,
            "features": "Up to 250 Teachers, Up to 6 Classes per Teacher, Up to 250 per Class",
        },
    }

    plan_details = plan_mapping.get(admin.plan, plan_mapping["mid"])  # Default to mid plan

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
        subscription_type=plan_details["type"],
        subscription_start_date=start_date,
        subscription_end_date=end_date,
        subscription_status="trial",  # Start with trial
        subscription_renewal_date=renewal_date,
        subscription_renewal_status="pending",
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
        subscription_status=db_admin.subscription_status,
    )


@app.post("/auth/register/teacher", response_model=UserResponse)
async def register_teacher(user: TeacherCreate, db: Session = Depends(get_db)):
    if db.query(Teacher).filter(Teacher.teacher_email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_teacher = Teacher(
        school_admin_id=user.school_admin_id,
        teacher_email=user.email,
        teacher_name=user.name,
        teacher_phone_number=user.phone_number,
        teacher_password_hash=get_password_hash(user.password),
        teacher_is_active=True,
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)

    return UserResponse(
        id=db_teacher.teacher_id, email=db_teacher.teacher_email, name=db_teacher.teacher_name
    )


@app.post("/auth/register/student", response_model=UserResponse)
async def register_student(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(Student).filter(Student.student_email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_student = Student(
        school_student_id=user.school_student_id,
        school_admin_id=user.school_admin_id,
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
        id=db_student.student_id, email=db_student.student_email, name=db_student.student_name
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
        data={"sub": str(user_id), "type": user_type}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Protected routes
@app.get("/students", response_model=List[StudentResponse])
async def get_students(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students


@app.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers


@app.get("/admins", response_model=List[AdminResponse])
async def get_admins(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    admins = db.query(Admin).all()
    return admins


@app.get("/me")
async def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user


# Course and Assignment Routes
@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course: CourseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    if not isinstance(current_user, Admin):
        raise HTTPException(status_code=403, detail="Only admins can create courses")

    db_course = Course(**course.model_dump(), course_is_active=True)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@app.get("/courses", response_model=List[CourseResponse])
def get_all_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.post("/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, Teacher):
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")

    db_assignment = Assignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@app.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@app.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])
def get_assignments_for_course(course_id: int, db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.assignment_course_id == course_id).all()
    return assignments


@app.post("/assignments/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user),
):
    if not isinstance(current_user, Student):
        raise HTTPException(status_code=403, detail="Only students can submit assignments")

    assignment = db.query(Assignment).filter(Assignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # 1. Call RAG API to get feedback
    rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8082")
    files = {"file": (file.filename, await file.read(), file.content_type)}
    data = {
        "student_id": str(current_user.student_id),
        "assignment_id": str(assignment_id),
        "course_id": str(assignment.assignment_course_id),
    }

    feedback_json = {}
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(f"{rag_api_url}/get-feedback/", files=files, data=data)
            response.raise_for_status()
            feedback_data = response.json()
            feedback_json = json.loads(feedback_data.get("feedback", "{}"))
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error calling RAG API: {e}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse feedback from RAG API")

    # 2. Save submission to user_data DB
    grade_list = feedback_json.get("grades", [])
    feedback_text = feedback_json.get("overall_feedback", "")

    new_submission = SubmittedAssignment(
        submitted_assignment_student_id=current_user.student_id,
        submitted_assignment_assignment_id=assignment_id,
        submission_status="graded",
        ai_feedback=feedback_text,
        ai_grade=grade_list,
        graded_at=datetime.utcnow(),
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    # 3. Trigger statistics update
    try:
        course = (
            db.query(Course).filter(Course.course_id == assignment.assignment_course_id).first()
        )
        # Assume average grade for now
        avg_grade = sum(grade_list) / len(grade_list) if grade_list else 0

        stats_payload = {
            "student_id": current_user.student_id,
            "course_name": course.course_name if course else "Unknown Course",
            "grade": avg_grade,
        }
        feedback_payload = {
            "student_id": current_user.student_id,
            "course_name": course.course_name if course else "Unknown Course",
            "feedback": feedback_text,
        }
        async with httpx.AsyncClient() as client:
            await client.post(f"{rag_api_url}/statistics/submissions", json=stats_payload)
            await client.post(f"{rag_api_url}/statistics/feedback", json=feedback_payload)
    except Exception as e:
        # Log this error but don't fail the request
        print(f"Failed to update statistics: {e}")

    return new_submission


if __name__ == "__main__":
    database.Base.metadata.create_all(bind=database.engine)
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))
