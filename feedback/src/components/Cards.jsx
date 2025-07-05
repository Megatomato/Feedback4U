import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import { formatDate, getDaysUntilDue, getStatusBadge } from '../utils/helpers';

export const CourseCard = ({ course, userRole, onClick }) => {
  return (
    <Card className="h-100 course-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Card.Body>
        <Card.Title>{course.name}</Card.Title>
        <Card.Text className="text-muted small mb-3">
          {course.description}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-people me-1"></i>
            <small>{course.students} students</small>
          </div>
          <div className="d-flex align-items-center">
            <i className="bi bi-file-text me-1"></i>
            <small>{course.assignments?.length || 0} assignments</small>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <small className="text-muted">Completion Rate</small>
            <small className="text-muted">{course.completionRate}%</small>
          </div>
          <ProgressBar
            now={course.completionRate}
            variant={course.completionRate >= 80 ? 'success' : course.completionRate >= 60 ? 'warning' : 'danger'}
            size="sm"
          />
        </div>
      </Card.Body>

      <Card.Footer className="bg-transparent">
        <small className="text-muted">
          {userRole === 'teacher' ? 'Manage Course' : 'View Course'}
        </small>
      </Card.Footer>
    </Card>
  );
};

export const AssignmentCard = ({ assignment, courseName, onClick }) => {
  const daysUntil = getDaysUntilDue(assignment.dueDate);
  const statusVariant = getStatusBadge(daysUntil);

  return (
    <Card className="assignment-card mb-3" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <Card.Title className="h6">{assignment.title}</Card.Title>
            <Card.Text className="text-muted small mb-2">
              {courseName}
            </Card.Text>
            <Card.Text className="small">
              {assignment.description}
            </Card.Text>
          </div>
          <Badge bg={statusVariant} className="ms-2">
            {daysUntil >= 0 ? `${daysUntil}d` : 'Overdue'}
          </Badge>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">
            Due: {formatDate(assignment.dueDate)}
          </small>
          <small className="text-muted">
            {assignment.submissionCount}/{assignment.totalStudents} submitted
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export const SubmissionCard = ({ submission, assignment, course, onClick }) => {
  return (
    <Card className="submission-card mb-3" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <Card.Title className="h6">{assignment?.title}</Card.Title>
            <Card.Text className="text-muted small">
              {course?.name}
            </Card.Text>
            {submission.grade && (
              <Badge bg={submission.grade >= 90 ? 'success' : submission.grade >= 80 ? 'info' : submission.grade >= 70 ? 'warning' : 'danger'}>
                {submission.grade}%
              </Badge>
            )}
          </div>
        </div>

        <small className="text-muted">
          Submitted: {formatDate(submission.submittedAt)}
        </small>

        {submission.feedback && (
          <Card.Text className="small mt-2 text-muted">
            {submission.feedback.substring(0, 100)}...
          </Card.Text>
        )}
      </Card.Body>
    </Card>
  );
};
