import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleData } from '../data/sampleData';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { StudentNav } from '../components/Navbar';

const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Find assignment and related data
  let assignment = null;
  let course = null;

  for (const c of sampleData.courses) {
    const found = sampleData.assignments.find(a => a.id === parseInt(id));
    if (found) {
      assignment = found;
      course = c;
      break;
    }
  }

  const submission = sampleData.submissions.find(s =>
    s.assignmentId === parseInt(id) && s.studentId === currentUser.id
  );

  if (!assignment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <h4>Assignment not found</h4>
          <p>The assignment you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  const generateAIFeedback = async () => {
    setLoadingFeedback(true);
    // Simulate AI feedback generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFeedback("Great work on this assignment! Your approach to the problem was methodical and well-structured. Consider expanding on your analysis in the conclusion section for even better results.");
    setLoadingFeedback(false);
  };

  return (
    <div>
    <StudentNav/>
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
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h4>{assignment.title}</h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <p><strong>Due Date:</strong> {formatDate(assignment.dueDate)}</p>
                <p><strong>Course:</strong> {course?.name} ({course?.code})</p>
                <p><strong>Instructor:</strong> {course?.instructor}</p>
              </div>

              <div className="mb-4">
                <h5>Description</h5>
                <p>{assignment.description}</p>
              </div>

              <Button className="mb-4" href={'/assignment/${id}/submission'}> Start a new submission </Button>

              {currentUser.role === 'student' && submission && (
                <div className="mb-4">
                  <h5>Your Submission</h5>
                  <div className="bg-light p-3 rounded">
                    <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
                    {submission.grade && (
                      <p>
                        <strong>Status:</strong>
                        <Badge bg="success" className="ms-2">Graded</Badge>
                      </p>
                    )}
                    {submission.grade && (
                      <p>
                        <strong>Grade:</strong>
                        <Badge bg="primary" className="ms-2">{submission.grade}%</Badge>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentUser.role === 'student' && (
                <div>
                  <h5>AI Feedback</h5>
                  {loadingFeedback ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Generating AI feedback...</p>
                    </div>
                  ) : (
                    <div className="bg-light p-3 rounded">
                      <p>{feedback || submission?.feedback || "No feedback available yet."}</p>
                      {!feedback && !submission?.feedback && (
                        <Button
                          variant="primary"
                          onClick={generateAIFeedback}
                          disabled={loadingFeedback}
                        >
                          Generate AI Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Assignment Details</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Course Information</h6>
                <p className="mb-1">{course?.name}</p>
                <p className="text-muted small">{course?.description}</p>
                <p className="mb-1"><strong>Instructor:</strong> {course?.instructor}</p>
                <p className="mb-1"><strong>Code:</strong> {course?.code}</p>
                <p className="mb-0"><strong>Students:</strong> {course?.students}</p>
              </div>

              <div>
                <h6>Submission Stats</h6>
                <p className="mb-1">
                  <strong>Submitted:</strong> {assignment.submissionCount}/{assignment.totalStudents}
                </p>
                <p className="mb-0">
                  <strong>Completion Rate:</strong> {Math.round((assignment.submissionCount / assignment.totalStudents) * 100)}%
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default AssignmentDetailsPage;
