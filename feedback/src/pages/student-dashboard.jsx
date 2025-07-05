import React from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sampleData } from '../data/sampleData';
import { getDaysUntilDue } from '../utils/helpers';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Get student's data
  const student = sampleData.students.find(s => s.id === currentUser.id);
  const studentCourses = sampleData.courses.filter(course =>
    student?.courses.includes(course.id)
  );

  // Get recent submissions
  const recentSubmissions = sampleData.submissions
    .filter(submission => submission.studentId === currentUser.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);

  // Get assignments due soon
  const dueSoonAssignments = sampleData.assignments
    .filter(assignment => {
      const daysUntil = getDaysUntilDue(assignment.dueDate);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate))
    .slice(0, 5);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  return (
    <Container className="my-4">
      {/* Header */}
      <div className="dashboard-header">
        <Row className="align-items-center mb-4">
          <Col>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-subtitle">Here's your academic overview</p>
          </Col>
        </Row>
      </div>

      <Row>
        {/* Due Soon Assignments */}
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-clock me-2"></i>
                📅 Due Soon
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {dueSoonAssignments.length > 0 ? (
                  dueSoonAssignments.map(assignment => {
                    const course = sampleData.courses.find(c => c.id === assignment.courseId);
                    const daysUntil = getDaysUntilDue(assignment.dueDate);
                    return (
                      <div
                        key={assignment.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleAssignmentClick(assignment.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{assignment.title}</h6>
                            <Badge bg={daysUntil === 0 ? 'danger' : 'warning'}>
                              {daysUntil === 0 ? 'Due Today' : `${daysUntil} days`}
                            </Badge>
                          </div>
                        </div>
                        <small className="text-muted">{course?.name}</small>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-muted">No assignments due soon</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* My Courses */}
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-book me-2"></i>
                📚 My Courses
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {studentCourses.map(course => (
                  <div
                    key={course.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => handleCourseClick(course.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-1">{course.name}</h6>
                      <Badge bg="primary">{course.code}</Badge>
                    </div>
                    <small className="text-muted d-block mb-2">{course.instructor}</small>
                    <div>
                      <small className="text-muted">Progress: {course.completionRate}%</small>
                      <ProgressBar
                        now={course.completionRate}
                        variant={course.completionRate >= 80 ? 'success' : course.completionRate >= 60 ? 'warning' : 'danger'}
                        size="sm"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Submissions */}
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-check-circle me-2"></i>
                ✅ Recent Submissions
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map(submission => {
                    const assignment = sampleData.assignments.find(a => a.id === submission.assignmentId);
                    const course = sampleData.courses.find(c => c.id === assignment?.courseId);
                    return (
                      <div
                        key={submission.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleAssignmentClick(assignment.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{assignment?.title}</h6>
                            {submission.grade && (
                              <Badge bg={submission.grade >= 90 ? 'success' : submission.grade >= 80 ? 'info' : submission.grade >= 70 ? 'warning' : 'danger'}>
                                {submission.grade}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <small className="text-muted">{course?.name}</small>
                        {submission.feedback && (
                          <p className="small text-muted mt-1 mb-0">
                            {submission.feedback.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-muted">No recent submissions</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Overview */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Performance Overview</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{student?.averageGrade || 0}%</h3>
                    <p className="text-muted mb-0">Average Grade</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{student?.submissionRate || 0}%</h3>
                    <p className="text-muted mb-0">Submission Rate</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{studentCourses.length}</h3>
                    <p className="text-muted mb-0">Enrolled Courses</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{recentSubmissions.length}</h3>
                    <p className="text-muted mb-0">Recent Submissions</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDashboard;
