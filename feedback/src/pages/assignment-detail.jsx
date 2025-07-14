import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI, courseAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { StudentNav } from '../components/Navbar';

const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [submission, setSubmission] = useState(null); // This would be fetched from an API
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        const assignmentRes = await assignmentAPI.getById(id);
        setAssignment(assignmentRes.data);
        if (assignmentRes.data) {
          const courseRes = await courseAPI.getById(assignmentRes.data.assignment_course_id);
          setCourse(courseRes.data);
        }
        // TODO: Fetch student's past submission for this assignment if it exists
      } catch (err) {
        console.error("Failed to fetch assignment data:", err);
        setError("Failed to load assignment details.");
      }
    };
    if (id) {
      fetchAssignmentData();
    }
  }, [id]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to submit.");
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // The school_student_id is no longer needed here
      const res = await assignmentAPI.submit(id, selectedFile);
      setSubmission(res.data);
      alert("Submission successful!");
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && !assignment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!assignment) {
    return <Container className="py-4">Loading...</Container>;
  }

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
              <h4>{assignment.assignment_name}</h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <p><strong>Due Date:</strong> {formatDate(assignment.assignment_due_date)}</p>
                <p><strong>Course:</strong> {course?.course_name}</p>
                <p><strong>Instructor:</strong> {course?.instructor || 'N/A'}</p>
              </div>

              <div className="mb-4">
                <h5>Description</h5>
                <p>{assignment.assignment_description}</p>
              </div>

              {!submission ? (
                <Form onSubmit={handleFormSubmit}>
                  <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Upload your assignment</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                  </Form.Group>
                  <Button type="submit" disabled={isSubmitting || !selectedFile}>
                    {isSubmitting ? 'Submitting...' : 'Submit for Feedback'}
                  </Button>
                  {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                </Form>
              ) : (
                <div className="mb-4">
                  <h5>Your Submission</h5>
                  <div className="bg-light p-3 rounded">
                    <p><strong>Submitted:</strong> {formatDate(submission.uploaded_at)}</p>
                    {submission.submission_status === 'graded' && (
                      <>
                        <p>
                          <strong>Status:</strong>
                          <Badge bg="success" className="ms-2">Graded</Badge>
                        </p>
                        <p>
                          <strong>Grade:</strong>
                          <Badge bg="primary" className="ms-2">{submission.ai_grade?.[0] || 'N/A'}%</Badge>
                        </p>
                        <p>
                          <strong>Feedback:</strong> {submission.ai_feedback || 'No feedback provided.'}
                        </p>
                      </>
                    )}
                  </div>
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
                <h5>Course Information</h5>
                <p className="mb-1">{course?.course_name}</p>
                <p className="text-muted small">{course?.course_description}</p>
                <p className="mb-1"><strong>Instructor:</strong> {course?.course_teacher_id || 'N/A'}</p>
                <p className="mb-1"><strong>Code:</strong> {course?.course_name || 'N/A'}</p>
                <p className="mb-0"><strong>Students:</strong> {course?.students || 'N/A'}</p>
              </div>

              <div>
                <h5>Submission Stats</h5>
                <p className="mb-1">
                  <strong>Submitted:</strong> {assignment.submissionCount || 0}/{assignment.totalStudents || 0}
                </p>
                <p className="mb-0">
                  <strong>Completion Rate:</strong> {Math.round(((assignment.submissionCount || 0) / (assignment.totalStudents || 1)) * 100)}%
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
