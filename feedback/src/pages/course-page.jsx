import React from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleData } from '../data/sampleData';
import { AssignmentCard } from '../components/Cards';
import { useAuth } from '../context/AuthContext';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const course = sampleData.courses.find(c => c.id === parseInt(id));
  const courseAssignments = sampleData.assignments.filter(a => a.courseId === parseInt(id));

  if (!course) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          <h4>Course not found</h4>
          <p>The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  return (
    <Container className="my-4">
      <Row className="mb-4">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/dashboard')}
            className="mb-3"
          >
            ← Back to Dashboard
          </Button>

          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1>{course.name}</h1>
              <Badge bg="primary" className="mb-2">{course.code}</Badge>
              <p className="text-muted mb-2">{course.description}</p>
              <p className="mb-0">
                <strong>Instructor:</strong> {course.instructor}
              </p>
            </div>
            <div className="text-end">
              <h3 className="text-primary">{course.completionRate}%</h3>
              <small className="text-muted">Completion Rate</small>
              <ProgressBar
                now={course.completionRate}
                variant={course.completionRate >= 80 ? 'success' : course.completionRate >= 60 ? 'warning' : 'danger'}
                className="mt-1"
              />
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Course Assignments</h5>
              <small className="text-muted">{courseAssignments.length} assignments</small>
            </Card.Header>
            <Card.Body>
              {courseAssignments.length > 0 ? (
                courseAssignments.map(assignment => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    courseName={course.name}
                    onClick={() => handleAssignmentClick(assignment.id)}
                  />
                ))
              ) : (
                <p className="text-muted">No assignments available for this course</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Course Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Students:</span>
                <strong>{course.students}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Assignments:</span>
                <strong>{courseAssignments.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Completion Rate:</span>
                <strong>{course.completionRate}%</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Average Submissions:</span>
                <strong>
                  {courseAssignments.length > 0
                    ? Math.round(courseAssignments.reduce((sum, a) => sum + a.submissionCount, 0) / courseAssignments.length)
                    : 0
                  }
                </strong>
              </div>
            </Card.Body>
          </Card>

          {currentUser.role === 'student' && (
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">My Performance</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Course Average:</span>
                  <Badge bg="success">92%</Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Assignments Completed:</span>
                  <strong>8/10</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Pending Submissions:</span>
                  <strong>2</strong>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CoursePage;
