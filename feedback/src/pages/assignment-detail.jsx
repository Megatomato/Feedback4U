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
  const [submission, setSubmission] = useState(null);
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
        // Fetch submission data based on user role
        if (user.role === 'student') {
          const submissionRes = await assignmentAPI.getSubmission(id);
          setSubmission(submissionRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch assignment data:", err);
        setError("Failed to load assignment details.");
      }
    };
    if (id) {
      fetchAssignmentData();
    }
  }, [id, user.role]);

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
      let res;
      if (user.role === 'student') {
        // Student submission
        res = await assignmentAPI.submit(id, selectedFile);
        setSubmission(res.data);
        alert("Submission successful!");
      } else if (user.role === 'teacher') {
        // Teacher upload (solution or materials)
        res = await assignmentAPI.uploadMaterials(id, selectedFile);
        alert("Materials uploaded successfully!");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.response?.data?.message || "Submission failed. Please try again.");
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

                {user.role === 'student' ? (
                  <>
                    {!submission ? (
                      <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formFile" className="mb-3">
                          <Form.Label>Upload your assignment submission</Form.Label>
                          <Form.Control type="file" onChange={handleFileChange} />
                          <Form.Text className="text-muted">
                            Submit your completed assignment for grading and feedback.
                          </Form.Text>
                        </Form.Group>
                        <Button type="submit" disabled={isSubmitting || !selectedFile}>
                          {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
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
                                {submission?.ai_feedback ? (
                                  <FeedbackDisplay feedback={JSON.parse(submission.ai_feedback)} />
                                ) : submission ? (
                                  <Alert variant="info">Your submission is being reviewed. Check back later for feedback.</Alert>
                                ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Form onSubmit={handleFormSubmit}>
                    <Form.Group controlId="formFile" className="mb-3">
                      <Form.Label>Upload teaching materials</Form.Label>
                      <Form.Control type="file" onChange={handleFileChange} />
                      <Form.Text className="text-muted">
                        Upload solution files, additional resources, or assignment materials.
                      </Form.Text>
                    </Form.Group>
                    <Button type="submit" disabled={isSubmitting || !selectedFile}>
                      {isSubmitting ? 'Uploading...' : 'Upload Materials'}
                    </Button>
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                  </Form>
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

                {user.role === 'teacher' && (
                  <div>
                    <h5>Submissions</h5>
                    <p className="mb-1">
                      <strong>Submitted:</strong> {assignment.submissionCount || 0}/{assignment.totalStudents || 0}
                    </p>
                    <p className="mb-0">
                      <strong>Completion Rate:</strong> {Math.round(((assignment.submissionCount || 0) / (assignment.totalStudents || 1)) * 100)}%
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const FeedbackDisplay = ({ feedback }) => {
  if (!feedback) return <Alert variant="info">No feedback available yet.</Alert>;

  const { overall_details, criteria, overall_evaluation } = feedback;

  return (
    <Card className="mb-4 border-primary">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">Assignment Feedback</h4>
      </Card.Header>
      <Card.Body>
        {/* Overall Evaluation Section */}
        <section className="mb-4">
          <h5 className="text-primary mb-3">
            <i className="fas fa-star me-2"></i>Overall Evaluation
          </h5>
          <div className="row">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded mb-3">
                <h6>Total Score</h6>
                <div className="d-flex align-items-center">
                  <div className="display-4 text-primary fw-bold me-3">
                    {overall_evaluation.mark_out_of_20.toFixed(1)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(overall_evaluation.mark_out_of_20 / 20) * 100}%` }}
                        aria-valuenow={overall_evaluation.mark_out_of_20}
                        aria-valuemin="0"
                        aria-valuemax="20"
                      ></div>
                    </div>
                    <small className="text-muted">out of 20 points</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded h-100">
                <h6>Details</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Word Count:</strong> {overall_details.word_count}
                  </li>
                  <li>
                    <strong>Overall Idea:</strong> {overall_details.overall_idea || 'Not provided'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Criteria Breakdown */}
        <section className="mb-4">
          <h5 className="text-primary mb-3">
            <i className="fas fa-clipboard-check me-2"></i>Criteria Breakdown
          </h5>
          <div className="row">
            {Object.entries(criteria).map(([criterion, details]) => (
              <div key={criterion} className="col-md-6 mb-3">
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">{criterion}</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary rounded-pill me-2">
                        {details.mark} pts
                      </span>
                      <small className="text-muted">/ 5 possible</small>
                    </div>
                    <div className="mb-2">
                      <strong>Evidence:</strong>
                      <p className="text-muted small mb-1">{details.evidence || 'Not provided'}</p>
                    </div>
                    <div>
                      <strong>Justification:</strong>
                      <p className="text-muted small mb-0">{details.justification || 'Not provided'}</p>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Feedback for Improvement */}
        <section>
          <h5 className="text-primary mb-3">
            <i className="fas fa-comment-dots me-2"></i>Feedback for Improvement
          </h5>
          <Card className="border-warning">
            <Card.Body className="bg-light-warning">
              <div className="d-flex">
                <div className="flex-shrink-0 me-3 text-warning">
                  <i className="fas fa-lightbulb fa-2x"></i>
                </div>
                <div>
                  <p className="mb-0">{overall_evaluation['feedback for improvement']}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>
      </Card.Body>
    </Card>
  );
};



export default AssignmentDetailsPage;
