from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from decimal import Decimal

from rag_db import (
    update_student_submission_stats,
    update_subject_feedback,
    update_teacher_analytics,
    get_student_statistics,
    get_teacher_analytics
)

router = APIRouter(
    prefix="/statistics",
    tags=["statistics"],
)

# Request Payloads
class SubmissionStatsPayload(BaseModel):
    student_id: int
    course_name: str
    grade: float

class SubjectFeedbackPayload(BaseModel):
    student_id: int
    course_name: str
    feedback: str

class TeacherAnalyticsPayload(BaseModel):
    teacher_id: int
    course_name: str
    worst_criteria: Dict[str, Any]
    grade_distribution: Dict[str, Any]

# Response Models
class SubjectGradeResponse(BaseModel):
    course_name: str
    grade: Decimal

    class Config:
        from_attributes = True

class SubjectFeedbackResponse(BaseModel):
    course_name: str
    last_feedback: Optional[str] = None

    class Config:
        from_attributes = True

class StudentStatisticsResponse(BaseModel):
    total_submissions: int
    average_grade_overall: Optional[Decimal] = None
    grades: List[SubjectGradeResponse]
    feedback: List[SubjectFeedbackResponse]

class TeacherAnalyticsResponse(BaseModel):
    teacher_id: int
    course_name: str
    worst_marked_criteria: Optional[Dict[str, Any]] = None
    student_grade_distribution: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


@router.post("/submissions", summary="Update student submission statistics")
async def update_submission_stats(payload: SubmissionStatsPayload):
    try:
        update_student_submission_stats(
            student_id=payload.student_id,
            course_name=payload.course_name,
            grade=payload.grade,
        )
        return {"message": "Student submission statistics updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback", summary="Update subject feedback for a student")
async def update_feedback(payload: SubjectFeedbackPayload):
    try:
        update_subject_feedback(
            student_id=payload.student_id,
            course_name=payload.course_name,
            feedback=payload.feedback,
        )
        return {"message": "Subject feedback updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/teacher", summary="Update teacher analytics")
async def update_analytics(payload: TeacherAnalyticsPayload):
    try:
        update_teacher_analytics(
            teacher_id=payload.teacher_id,
            course_name=payload.course_name,
            worst_criteria=payload.worst_criteria,
            grade_distribution=payload.grade_distribution,
        )
        return {"message": "Teacher analytics updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/{student_id}", response_model=StudentStatisticsResponse)
def get_student_stats(student_id: int):
    try:
        data = get_student_statistics(student_id)
        if not data:
            raise HTTPException(status_code=404, detail="Statistics not found for student")
        
        # Manually construct the response to match the Pydantic model
        return StudentStatisticsResponse(
            total_submissions=data["statistics"].total_submissions,
            average_grade_overall=data["statistics"].average_grade_overall,
            grades=[SubjectGradeResponse.from_orm(g) for g in data["grades"]],
            feedback=[SubjectFeedbackResponse.from_orm(f) for f in data["feedback"]],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teacher/{teacher_id}", response_model=List[TeacherAnalyticsResponse])
def get_teacher_stats(teacher_id: int):
    try:
        analytics = get_teacher_analytics(teacher_id)
        if not analytics:
            # Return empty list instead of 404 to be idempotent
            return []
        return [TeacherAnalyticsResponse.from_orm(a) for a in analytics]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 