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
import random
import string
import tempfile
import logging

# Import from RAG module
from RAG.rag_db import ingest_reference_file

# Import database models and schemas
from database import (
    get_db,
    Admin,
    Teacher,
    Student,
    Course,
    Assignment,
    Enrollment,
    SubmittedAssignment,
    AdminCreate,
    AdminResponse,
    TeacherCreate,
    TeacherCreateResponse,
    UserCreate,
    UserResponse,
    StudentCreateResponse,
    UserMeResponse,
    StudentResponse,
    TeacherResponse,
    CourseCreate,
    CourseResponse,
    CourseWithTeacherResponse,
    CourseWithStatsResponse,
    StudentCourseResponse,
    EnrollmentCreate,
    EnrollmentCreateBySchoolId,
    EnrollmentResponse,
    AssignmentCreate,
    AssignmentResponse,
    AssignmentWithCourseResponse,
    CourseStudentResponse,
    CourseDetailResponse,
    SubmissionResponse,
    Token,
    create_cross_table_email_uniqueness_triggers,
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


def generate(length=12, use_uppercase=True, use_digits=True, use_special=True):
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase if use_uppercase else ""
    digits = string.digits if use_digits else ""
    special = "!@#$%^&*()_+-=[]{}|;:,.<>?" if use_special else ""

    # Combine all allowed characters
    all_chars = lowercase + uppercase + digits + special

    # Ensure at least one character from each selected set is included
    password = []
    if use_uppercase:
        password.append(random.choice(uppercase))
    if use_digits:
        password.append(random.choice(digits))
    if use_special:
        password.append(random.choice(special))

    # Fill the rest with random choices from all allowed characters
    remaining_length = length - len(password)
    password.extend(random.choice(all_chars) for _ in range(remaining_length))

    # Shuffle to avoid predictable patterns
    random.shuffle(password)

    return "".join(password)


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


def check_email_exists_across_all_tables(email: str, db: Session) -> bool:
    """
    Check if an email exists in any of the user tables (admin, teachers, students).
    Returns True if email exists, False otherwise.
    """
    # Check admin table
    admin_exists = db.query(Admin).filter(Admin.admin_email == email).first() is not None
    if admin_exists:
        return True

    # Check teachers table
    teacher_exists = db.query(Teacher).filter(Teacher.teacher_email == email).first() is not None
    if teacher_exists:
        return True

    # Check students table
    student_exists = db.query(Student).filter(Student.student_email == email).first() is not None
    if student_exists:
        return True

    return False


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


@app.post("/upload-reference/{assignment_id}", summary="Upload a reference document")
async def upload_reference(
    assignment_id: int,
    file: UploadFile = File(..., description="The reference PDF file (e.g., rubric, exemplar)."),
    doc_type: str = Form("rubric", description="Type of document (e.g., 'rubric', 'exemplar')."),
    chunker: str = Form(
        "recursive", enum=["recursive", "semantic"], description="Chunking strategy."
    ),
    embedder: str = Form(
        "gitee", enum=["openai", "gemini", "gitee"], description="Embedding model."
    ),
    current_user=Depends(get_current_user),
):
    """
    Uploads a reference document, processes it, and stores it in the vector database.
    This is used to provide context (like rubrics or exemplars) for feedback generation.
    """
    tmp_path = None
    try:
        # Save uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        logging.info(f"Processing reference file: {file.filename} for assignment {assignment_id}")
        ingest_reference_file(
            file_path=tmp_path,
            assignment_id=assignment_id,
            doc_type=doc_type,
            chunker=chunker,
            embedder_name=embedder,
        )

    except Exception as e:
        logging.error(f"Error processing reference file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {
        "message": f"Reference document '{file.filename}' uploaded successfully for assignment '{assignment_id}'."
    }


# Authentication routes
@app.post("/auth/register/admin", response_model=AdminResponse)
async def register_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    # Check if email already exists across all user tables
    if check_email_exists_across_all_tables(admin.email, db):
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


@app.post("/auth/register/teacher", response_model=TeacherCreateResponse)
async def register_teacher(user: TeacherCreate, db: Session = Depends(get_db)):
    # Check if email already exists across all user tables
    if check_email_exists_across_all_tables(user.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate a secure random password if not provided
    password = user.password if user.password else generate()

    db_teacher = Teacher(
        school_admin_id=user.school_admin_id,
        teacher_email=user.email,
        teacher_name=user.name,
        teacher_phone_number=user.phone_number,
        teacher_password_hash=get_password_hash(password),
        teacher_is_active=True,
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)

    return TeacherCreateResponse(
        id=db_teacher.teacher_id,
        email=db_teacher.teacher_email,
        name=db_teacher.teacher_name,
        generated_password=password,
    )


@app.post("/auth/register/student", response_model=StudentCreateResponse)
async def register_student(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists across all user tables
    if check_email_exists_across_all_tables(user.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate a secure random password if not provided
    password = user.password if user.password else generate()

    db_student = Student(
        school_student_id=user.school_student_id,
        school_admin_id=user.school_admin_id,
        student_email=user.email,
        student_name=user.name,
        student_phone_number=user.phone_number,
        student_password_hash=get_password_hash(password),
        student_average_grade=0,
        student_is_studying=True,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return StudentCreateResponse(
        id=db_student.student_id,
        email=db_student.student_email,
        name=db_student.student_name,
        generated_password=password,
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


@app.get("/teachers/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """Get teacher information by teacher_id"""
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@app.get("/admins", response_model=List[AdminResponse])
async def get_admins(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    admins = db.query(Admin).all()
    return admins


@app.get("/admin/statistics")
async def get_admin_school_statistics(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get statistics for the admin's school"""
    if not isinstance(current_user, Admin):
        raise HTTPException(status_code=403, detail="Only admins can access school statistics")

    admin_id = current_user.admin_id

    # Count teachers in this school
    total_teachers = db.query(Teacher).filter(Teacher.school_admin_id == admin_id).count()

    # Count students in this school
    total_students = db.query(Student).filter(Student.school_admin_id == admin_id).count()

    # Count courses taught by teachers in this school
    teacher_ids = (
        db.query(Teacher.teacher_id).filter(Teacher.school_admin_id == admin_id).subquery()
    )
    total_courses = db.query(Course).filter(Course.course_teacher_id.in_(teacher_ids)).count()

    # Calculate average submissions per student (if submission data exists)
    try:
        # Get students in this school
        students_in_school = (
            db.query(Student.student_id).filter(Student.school_admin_id == admin_id).subquery()
        )
        total_submissions = (
            db.query(SubmittedAssignment)
            .filter(SubmittedAssignment.submitted_assignment_student_id.in_(students_in_school))
            .count()
        )

        avg_submissions_per_student = (
            round(total_submissions / total_students, 1) if total_students > 0 else 0
        )
    except:
        avg_submissions_per_student = 0

    return {
        "school_name": current_user.school_name,
        "total_courses": total_courses,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "avg_submissions_per_student": avg_submissions_per_student,
    }


@app.get("/teacher/statistics")
async def get_teacher_statistics(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get statistics for the current teacher"""
    if not isinstance(current_user, Teacher):
        raise HTTPException(status_code=403, detail="Only teachers can access their statistics")

    teacher_id = current_user.teacher_id

    # Count courses taught by this teacher
    total_courses = db.query(Course).filter(Course.course_teacher_id == teacher_id).count()

    # Count assignments created by this teacher (assignments are linked to courses)
    course_ids = (
        db.query(Course.course_id).filter(Course.course_teacher_id == teacher_id).subquery()
    )
    total_assignments = (
        db.query(Assignment).filter(Assignment.assignment_course_id.in_(course_ids)).count()
    )

    # Count submissions to this teacher's assignments
    try:
        assignment_ids = (
            db.query(Assignment.assignment_id)
            .filter(Assignment.assignment_course_id.in_(course_ids))
            .subquery()
        )
        total_submissions = (
            db.query(SubmittedAssignment)
            .filter(SubmittedAssignment.submitted_assignment_assignment_id.in_(assignment_ids))
            .count()
        )
    except:
        total_submissions = 0

    # Get teacher's school info
    admin = db.query(Admin).filter(Admin.admin_id == current_user.school_admin_id).first()
    school_name = admin.school_name if admin else "Unknown School"

    return {
        "teacher_name": current_user.teacher_name,
        "teacher_email": current_user.teacher_email,
        "school_name": school_name,
        "total_courses": total_courses,
        "total_assignments": total_assignments,
        "total_submissions": total_submissions,
    }


@app.get("/student/statistics")
async def get_student_statistics(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get statistics for the current student"""
    if not isinstance(current_user, Student):
        raise HTTPException(status_code=403, detail="Only students can access their statistics")

    student_id = current_user.student_id

    # Count courses the student is enrolled in
    total_courses = db.query(Enrollment).filter(Enrollment.student_id == student_id).count()

    # Count total submissions by this student
    total_submissions = (
        db.query(SubmittedAssignment)
        .filter(SubmittedAssignment.submitted_assignment_student_id == student_id)
        .count()
    )

    # Calculate overall average grade
    try:
        submissions_with_grades = (
            db.query(SubmittedAssignment)
            .filter(
                SubmittedAssignment.submitted_assignment_student_id == student_id,
                SubmittedAssignment.ai_grade.isnot(None),
            )
            .all()
        )

        if submissions_with_grades:
            all_grades = []
            for submission in submissions_with_grades:
                if submission.ai_grade and len(submission.ai_grade) > 0:
                    all_grades.extend([float(grade) for grade in submission.ai_grade])

            overall_average_grade = (
                round(sum(all_grades) / len(all_grades), 2) if all_grades else None
            )
        else:
            overall_average_grade = None
    except:
        overall_average_grade = None

    # Count pending assignments (assignments not yet submitted in enrolled courses)
    try:
        # Get all course IDs the student is enrolled in
        enrolled_course_ids = (
            db.query(Enrollment.course_id).filter(Enrollment.student_id == student_id).subquery()
        )

        # Count all assignments in enrolled courses
        total_available_assignments = (
            db.query(Assignment)
            .filter(Assignment.assignment_course_id.in_(enrolled_course_ids))
            .count()
        )

        pending_assignments = total_available_assignments - total_submissions
        pending_assignments = max(0, pending_assignments)  # Ensure non-negative
    except:
        pending_assignments = 0

    # Get student's school info
    admin = db.query(Admin).filter(Admin.admin_id == current_user.school_admin_id).first()
    school_name = admin.school_name if admin else "Unknown School"

    return {
        "student_name": current_user.student_name,
        "student_email": current_user.student_email,
        "school_name": school_name,
        "total_courses": total_courses,
        "total_submissions": total_submissions,
        "pending_assignments": pending_assignments,
        "overall_average_grade": overall_average_grade,
    }


@app.get("/me", response_model=UserMeResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    # Normalize the user data based on user type
    if isinstance(current_user, Student):
        return UserMeResponse(
            id=current_user.student_id,
            name=current_user.student_name,
            email=current_user.student_email,
            phone=current_user.student_phone_number,
            role="student",
            school_admin_id=current_user.school_admin_id,
        )
    elif isinstance(current_user, Teacher):
        return UserMeResponse(
            id=current_user.teacher_id,
            name=current_user.teacher_name,
            email=current_user.teacher_email,
            phone=current_user.teacher_phone_number,
            role="teacher",
            school_admin_id=current_user.school_admin_id,
        )
    elif isinstance(current_user, Admin):
        return UserMeResponse(
            id=current_user.admin_id,
            name=current_user.admin_name,
            email=current_user.admin_email,
            phone=current_user.admin_phone_number,
            role="admin",
            school_name=current_user.school_name,
        )
    else:
        raise HTTPException(status_code=500, detail="Invalid user type")


# Course and Assignment Routes
@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course: CourseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    # Debug logging
    print(
        f"User attempting to create course: {type(current_user)} - {getattr(current_user, 'admin_email', getattr(current_user, 'teacher_email', getattr(current_user, 'student_email', 'unknown')))}"
    )
    print(f"Is Admin: {isinstance(current_user, Admin)}")

    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=403,
            detail=f"Only admins can create courses. Current user type: {type(current_user).__name__}",
        )

    # Find teacher by email
    teacher = db.query(Teacher).filter(Teacher.teacher_email == course.teacher_email).first()
    if not teacher:
        raise HTTPException(
            status_code=404, detail=f"Teacher with email {course.teacher_email} not found"
        )

    # Verify teacher belongs to the same school as admin
    if teacher.school_admin_id != current_user.admin_id:
        raise HTTPException(status_code=403, detail="Teacher does not belong to your school")

    # Create course with teacher_id from the found teacher
    course_data = course.model_dump()
    course_data.pop("teacher_email")  # Remove teacher_email
    course_data["course_teacher_id"] = teacher.teacher_id  # Add teacher_id

    db_course = Course(**course_data, course_is_active=True)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@app.get("/courses", response_model=List[CourseResponse])
def get_all_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@app.get("/admin/courses", response_model=List[CourseWithTeacherResponse])
def get_admin_school_courses(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all courses for the admin's school with teacher information"""
    if not isinstance(current_user, Admin):
        raise HTTPException(status_code=403, detail="Only admins can access school courses")

    # Join courses with teachers to get teacher info, filtered by school
    courses_with_teachers = (
        db.query(Course, Teacher)
        .join(Teacher, Course.course_teacher_id == Teacher.teacher_id)
        .filter(Teacher.school_admin_id == current_user.admin_id)
        .all()
    )

    # Transform the result into CourseWithTeacherResponse format
    result = []
    for course, teacher in courses_with_teachers:
        result.append(
            CourseWithTeacherResponse(
                course_id=course.course_id,
                course_name=course.course_name,
                course_description=course.course_description,
                course_is_active=course.course_is_active,
                course_teacher_id=course.course_teacher_id,
                teacher_name=teacher.teacher_name,
                teacher_email=teacher.teacher_email,
            )
        )

    return result


@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.get("/courses/{course_id}/details", response_model=CourseDetailResponse)
def get_course_details(
    course_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get detailed course information with students (for teachers and admins)"""

    # Get course with teacher information
    course_query = (
        db.query(Course, Teacher)
        .join(Teacher, Course.course_teacher_id == Teacher.teacher_id)
        .filter(Course.course_id == course_id)
        .first()
    )

    if not course_query:
        raise HTTPException(status_code=404, detail="Course not found")

    course, teacher = course_query

    # Check permissions
    if isinstance(current_user, Teacher):
        if course.course_teacher_id != current_user.teacher_id:
            raise HTTPException(
                status_code=403, detail="You can only view details of your own courses"
            )
    elif isinstance(current_user, Admin):
        if teacher.school_admin_id != current_user.admin_id:
            raise HTTPException(
                status_code=403, detail="You can only view courses from your school"
            )
    elif isinstance(current_user, Student):
        # Students get basic info without student list
        pass
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    # Count total assignments
    total_assignments = (
        db.query(Assignment).filter(Assignment.assignment_course_id == course_id).count()
    )

    # Count total enrolled students
    total_students = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()

    # Get student details (only for teachers and admins)
    students_data = None
    if isinstance(current_user, (Teacher, Admin)):
        # Get enrolled students with their submission statistics
        enrolled_students = (
            db.query(Student, Enrollment)
            .join(Enrollment, Student.student_id == Enrollment.student_id)
            .filter(Enrollment.course_id == course_id)
            .all()
        )

        students_data = []
        for student, enrollment in enrolled_students:
            # Count submitted assignments by this student in this course
            submitted_assignments = (
                db.query(SubmittedAssignment)
                .join(
                    Assignment,
                    SubmittedAssignment.submitted_assignment_assignment_id
                    == Assignment.assignment_id,
                )
                .filter(
                    Assignment.assignment_course_id == course_id,
                    SubmittedAssignment.submitted_assignment_student_id == student.student_id,
                )
                .count()
            )

            # Calculate average grade for this student in this course
            try:
                submissions = (
                    db.query(SubmittedAssignment)
                    .join(
                        Assignment,
                        SubmittedAssignment.submitted_assignment_assignment_id
                        == Assignment.assignment_id,
                    )
                    .filter(
                        Assignment.assignment_course_id == course_id,
                        SubmittedAssignment.submitted_assignment_student_id == student.student_id,
                        SubmittedAssignment.ai_grade.isnot(None),
                    )
                    .all()
                )

                if submissions:
                    grades = []
                    for submission in submissions:
                        if submission.ai_grade and len(submission.ai_grade) > 0:
                            grades.extend([float(grade) for grade in submission.ai_grade])

                    average_grade = round(sum(grades) / len(grades), 2) if grades else None
                else:
                    average_grade = None
            except:
                average_grade = None

            students_data.append(
                CourseStudentResponse(
                    student_id=student.student_id,
                    student_name=student.student_name,
                    student_email=student.student_email,
                    school_student_id=student.school_student_id,
                    enrollment_date=enrollment.enrollment_date,
                    submitted_assignments=submitted_assignments,
                    total_assignments=total_assignments,
                    average_grade=average_grade,
                )
            )

    return CourseDetailResponse(
        course_id=course.course_id,
        course_name=course.course_name,
        course_description=course.course_description,
        course_is_active=course.course_is_active,
        course_teacher_id=course.course_teacher_id,
        teacher_name=teacher.teacher_name,
        teacher_email=teacher.teacher_email,
        total_assignments=total_assignments,
        total_students=total_students,
        students=students_data,
    )


@app.get("/teacher/courses", response_model=List[CourseWithStatsResponse])
def get_teacher_courses(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all courses taught by the current teacher with assignment and submission statistics"""
    if not isinstance(current_user, Teacher):
        raise HTTPException(status_code=403, detail="Only teachers can access their courses")

    # Get all courses taught by this teacher
    courses = db.query(Course).filter(Course.course_teacher_id == current_user.teacher_id).all()

    # Build response with statistics for each course
    result = []
    for course in courses:
        # Count assignments for this course
        assignment_count = (
            db.query(Assignment).filter(Assignment.assignment_course_id == course.course_id).count()
        )

        # Count total enrolled students for this course
        total_students = (
            db.query(Enrollment).filter(Enrollment.course_id == course.course_id).count()
        )

        # Count submissions for assignments in this course
        try:
            assignment_ids = (
                db.query(Assignment.assignment_id)
                .filter(Assignment.assignment_course_id == course.course_id)
                .subquery()
            )
            total_submissions = (
                db.query(SubmittedAssignment)
                .filter(SubmittedAssignment.submitted_assignment_assignment_id.in_(assignment_ids))
                .count()
            )
        except:
            total_submissions = 0

        result.append(
            CourseWithStatsResponse(
                course_id=course.course_id,
                course_name=course.course_name,
                course_description=course.course_description,
                course_is_active=course.course_is_active,
                course_teacher_id=course.course_teacher_id,
                assignment_count=assignment_count,
                total_students=total_students,
                total_submissions=total_submissions,
            )
        )

    return result


@app.get("/student/courses", response_model=List[StudentCourseResponse])
def get_student_courses(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all courses the current student is enrolled in with statistics"""
    if not isinstance(current_user, Student):
        raise HTTPException(status_code=403, detail="Only students can access their courses")

    student_id = current_user.student_id

    # Find all courses where the student is enrolled
    courses_query = (
        db.query(Course, Teacher, Enrollment)
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .join(Teacher, Course.course_teacher_id == Teacher.teacher_id)
        .filter(Enrollment.student_id == student_id)
        .all()
    )

    result = []
    for course, teacher, enrollment in courses_query:
        # Count total assignments in this course
        total_assignments = (
            db.query(Assignment).filter(Assignment.assignment_course_id == course.course_id).count()
        )

        # Count submitted assignments by this student in this course
        submitted_assignments = (
            db.query(SubmittedAssignment)
            .join(
                Assignment,
                SubmittedAssignment.submitted_assignment_assignment_id == Assignment.assignment_id,
            )
            .filter(
                Assignment.assignment_course_id == course.course_id,
                SubmittedAssignment.submitted_assignment_student_id == student_id,
            )
            .count()
        )

        # Calculate average grade for this student in this course
        try:
            submissions = (
                db.query(SubmittedAssignment)
                .join(
                    Assignment,
                    SubmittedAssignment.submitted_assignment_assignment_id
                    == Assignment.assignment_id,
                )
                .filter(
                    Assignment.assignment_course_id == course.course_id,
                    SubmittedAssignment.submitted_assignment_student_id == student_id,
                    SubmittedAssignment.ai_grade.isnot(None),
                )
                .all()
            )

            if submissions:
                grades = []
                for submission in submissions:
                    if submission.ai_grade and len(submission.ai_grade) > 0:
                        grades.extend([float(grade) for grade in submission.ai_grade])

                average_grade = round(sum(grades) / len(grades), 2) if grades else None
            else:
                average_grade = None
        except:
            average_grade = None

        result.append(
            StudentCourseResponse(
                course_id=course.course_id,
                course_name=course.course_name,
                course_description=course.course_description,
                course_is_active=course.course_is_active,
                teacher_name=teacher.teacher_name,
                teacher_email=teacher.teacher_email,
                total_assignments=total_assignments,
                submitted_assignments=submitted_assignments,
                average_grade=average_grade,
            )
        )

    return result


@app.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Enroll a student in a course (admin or teacher only)"""
    if not isinstance(current_user, (Admin, Teacher)):
        raise HTTPException(status_code=403, detail="Only admins or teachers can enroll students")

    # Check if student exists and belongs to the same school
    student = db.query(Student).filter(Student.student_id == enrollment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if course exists
    course = db.query(Course).filter(Course.course_id == enrollment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verify school permissions
    if isinstance(current_user, Admin):
        if student.school_admin_id != current_user.admin_id:
            raise HTTPException(status_code=403, detail="Can only enroll students from your school")
    elif isinstance(current_user, Teacher):
        if student.school_admin_id != current_user.school_admin_id:
            raise HTTPException(status_code=403, detail="Can only enroll students from your school")
        if course.course_teacher_id != current_user.teacher_id:
            raise HTTPException(
                status_code=403, detail="Can only enroll students in your own courses"
            )

    # Check if enrollment already exists
    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == enrollment.student_id,
            Enrollment.course_id == enrollment.course_id,
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course")

    # Create new enrollment
    db_enrollment = Enrollment(student_id=enrollment.student_id, course_id=enrollment.course_id)

    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


@app.post(
    "/admin/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED
)
def create_enrollment_by_school_id(
    enrollment: EnrollmentCreateBySchoolId,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Enroll a student in a course by school student ID (admin only)"""
    if not isinstance(current_user, Admin):
        raise HTTPException(status_code=403, detail="Only admins can use this enrollment method")

    # Find student by school_student_id and admin_id
    student = (
        db.query(Student)
        .filter(
            Student.school_student_id == enrollment.school_student_id,
            Student.school_admin_id == current_user.admin_id,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=f"Student with school ID {enrollment.school_student_id} not found in your school",
        )

    # Check if course exists and belongs to the same school
    course = db.query(Course).filter(Course.course_id == enrollment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verify course belongs to the same school
    course_teacher = (
        db.query(Teacher).filter(Teacher.teacher_id == course.course_teacher_id).first()
    )
    if not course_teacher or course_teacher.school_admin_id != current_user.admin_id:
        raise HTTPException(status_code=403, detail="Course does not belong to your school")

    # Check if enrollment already exists
    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student.student_id,
            Enrollment.course_id == enrollment.course_id,
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=400,
            detail=f"Student {student.student_name} is already enrolled in this course",
        )

    # Create new enrollment
    db_enrollment = Enrollment(student_id=student.student_id, course_id=enrollment.course_id)

    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


@app.get("/enrollments", response_model=List[EnrollmentResponse])
def get_enrollments(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all enrollments (admin only)"""
    if not isinstance(current_user, Admin):
        raise HTTPException(status_code=403, detail="Only admins can view all enrollments")

    # Get enrollments for students in this admin's school
    enrollments = (
        db.query(Enrollment)
        .join(Student, Enrollment.student_id == Student.student_id)
        .filter(Student.school_admin_id == current_user.admin_id)
        .all()
    )

    return enrollments


@app.delete("/enrollments/{student_id}/{course_id}")
def drop_enrollment(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Drop a student from a course (admin or teacher only)"""
    if not isinstance(current_user, (Admin, Teacher)):
        raise HTTPException(status_code=403, detail="Only admins or teachers can drop students")

    # Find the enrollment
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.course_id == course_id)
        .first()
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Check permissions
    student = db.query(Student).filter(Student.student_id == student_id).first()
    course = db.query(Course).filter(Course.course_id == course_id).first()

    if isinstance(current_user, Admin):
        if student.school_admin_id != current_user.admin_id:
            raise HTTPException(status_code=403, detail="Can only manage students from your school")
    elif isinstance(current_user, Teacher):
        if student.school_admin_id != current_user.school_admin_id:
            raise HTTPException(status_code=403, detail="Can only manage students from your school")
        if course.course_teacher_id != current_user.teacher_id:
            raise HTTPException(
                status_code=403, detail="Can only manage enrollments in your own courses"
            )

    # Delete the enrollment
    db.delete(enrollment)
    db.commit()

    return {"message": "Student dropped from course successfully"}


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


@app.get("/student/assignments/due-soon", response_model=List[AssignmentWithCourseResponse])
def get_student_assignments_due_soon(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get the top 3 upcoming assignments due for the current student"""
    if not isinstance(current_user, Student):
        raise HTTPException(status_code=403, detail="Only students can access their assignments")

    student_id = current_user.student_id

    # Get current time
    now = datetime.utcnow()

    # Get all course IDs the student is enrolled in
    enrolled_course_ids = (
        db.query(Enrollment.course_id).filter(Enrollment.student_id == student_id).subquery()
    )

    # Get the top 3 upcoming assignments in enrolled courses
    assignments_query = (
        db.query(Assignment, Course)
        .join(Course, Assignment.assignment_course_id == Course.course_id)
        .filter(
            Assignment.assignment_course_id.in_(enrolled_course_ids),
            Assignment.assignment_due_date >= now,
            Assignment.assignment_status == "active",
        )
        .order_by(Assignment.assignment_due_date)
        .limit(3)
    )

    assignments_with_courses = assignments_query.all()

    # Check which assignments have been submitted
    result = []
    for assignment, course in assignments_with_courses:
        # Check if student has submitted this assignment
        submission = (
            db.query(SubmittedAssignment)
            .filter(
                SubmittedAssignment.submitted_assignment_student_id == student_id,
                SubmittedAssignment.submitted_assignment_assignment_id == assignment.assignment_id,
            )
            .first()
        )

        result.append(
            AssignmentWithCourseResponse(
                assignment_id=assignment.assignment_id,
                assignment_name=assignment.assignment_name,
                assignment_description=assignment.assignment_description,
                assignment_due_date=assignment.assignment_due_date,
                assignment_status=assignment.assignment_status,
                assignment_course_id=assignment.assignment_course_id,
                course_name=course.course_name,
                is_submitted=submission is not None,
            )
        )

    return result


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

    # Pass through embedder/provider preferences to RAG API (defaults set in env)
    rag_embedder = os.getenv("RAG_EMBEDDER", "gitee")
    rag_provider = os.getenv("RAG_PROVIDER", "deepseek")
    data.update({"embedder": rag_embedder, "provider": rag_provider})

    feedback_json = {}
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(f"{rag_api_url}/get-feedback/", files=files, data=data)
            response.raise_for_status()
            feedback_data = response.json()
            feedback_json = (
                json.loads(feedback_data) if isinstance(feedback_data, str) else feedback_data
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error calling RAG API: {e}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse feedback from RAG API")

    feedback_text = json.dumps(feedback_json)

    if "overall_evaluation" in feedback_json:
        overall_mark = feedback_json.get("overall_evaluation", {}).get("mark_out_of_20", 0)
    else:
        # Legacy fallback: use average of provided grades or 0.
        grades_fallback = feedback_json.get("grades", [])
        overall_mark = sum(grades_fallback) / len(grades_fallback) if grades_fallback else 0

    grade_list = [overall_mark]

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
    create_cross_table_email_uniqueness_triggers(database.engine)
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))
