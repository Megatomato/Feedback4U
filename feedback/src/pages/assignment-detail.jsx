import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI, courseAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { StudentNav } from '../components/Navbar';
import ChromeDinoGame from 'react-chrome-dino';

const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseDet, setCourseDet] = useState(null);
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
          const courseDetRes = await courseAPI.getDetails(assignmentRes.data.assignment_course_id);
          setCourse(courseRes.data);
          setCourseDet(courseDetRes.data);
          console.log(courseRes.data)
          console.log(courseDetRes.data)
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
      } else if (user.role === 'teacher') {
        // Teacher upload (solution or materials)
        res = await assignmentAPI.submitRef(id, selectedFile);
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
                  <p><strong>Instructor:</strong> {courseDet?.teacher_name || 'N/A'}</p>
                </div>

                <div className="mb-4">
                  <h5>Description</h5>
                  <p>{assignment.assignment_description}</p>
                </div>

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
                  <p className="mb-1"><strong>Instructor:</strong> {courseDet?.teacher_name || 'N/A'}</p>
                  <p className="mb-1"><strong>Code:</strong> {course?.course_name || 'N/A'}</p>
                  <p className="mb-0"><strong>Students:</strong> {courseDet?.total_students || 'N/A'}</p>
                </div>

                {user.role === 'teacher' && (
                  <div>
                    <h5>Amount of Student Submitted</h5>
                    <p className="mb-1">
                    {courseDet &&
                      `${courseDet.students.reduce((sum, s) => sum + (s.submitted_assignments > 0 ?? 1 : 0), 0)} / ${courseDet.total_students ?? 0}`}
                    </p>
                    <h5 className="mt-3">Total Submissions</h5>
                      {courseDet &&
                        `${courseDet.students.reduce((sum, s) => sum + (s.submitted_assignments), 0)}`}
                    <p className="mb-0 my-3">
                      <strong>Completion Rate: </strong>
                        {courseDet && courseDet.students ?
                          Math.round((courseDet.students.reduce((sum, s) => sum + (s.submitted_assignments > 0 ?? 1 : 0), 0) /
                          (courseDet.total_students * courseDet.total_assignments)) * 100) || 0 : 0}%
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="mb-4 my-4">
          <Col>
                {user.role === 'student' ? (
                  <>
                    <Card>
                      <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formFile" className="mb-3">
                          <Form.Label><Card.Title className="my-2 mx-2">Upload your assignment submission</Card.Title></Form.Label>
                          <Form.Control type="file" onChange={handleFileChange} required/>
                          <Form.Text className="text-muted">
                            Submit your completed assignment for grading and feedback.
                          </Form.Text>
                        </Form.Group>
                        <Button type="submit" disabled={isSubmitting || !selectedFile}>
                          {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                        </Button>
                        {isSubmitting && !submission && (
                          <div style={{ position: "relative" }}>
                            <ChromeDinoGame gameOver={!isSubmitting} />
                            {/* Cover the duplicate (if it appears) */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                background: "#faf4ed",
                                position: "absolute",
                                top: 150,
                                left: 200,
                                width: "60%",
                                height: "50%",
                                pointerEvents: "none",
                              }}
                            />
                          </div>
                        )}
                        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                      </Form>
                    </Card>
                    {submission ? (
                    <Card className="my-4">
                      <div className="mb-4">
                        <Card.Title className="my-2 mx-2"><h4>Your Submission</h4></Card.Title>
                        <div className="bg-light p-3 rounded">
                          <p><strong>Submitted:</strong> {formatDate(submission.uploaded_at)}</p>
                          {submission.submission_status === 'graded' && (
                            <>
                              <p>
                                <strong>Status:</strong>
                                <Badge bg="success" className="ms-2">Graded</Badge>
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
                      </Card>
                    ) : (
                    <> </>
                    )}
                  </>
                ) : (
                <Card className="my-4">
                  <Form onSubmit={handleFormSubmit}>
                    <Form.Group controlId="formFile" className="mb-3">
                      <Form.Label>
                        <Card.Title>Upload teaching materials</Card.Title>
                      </Form.Label>
                      <Form.Control type="file" onChange={handleFileChange} required/>
                      <Form.Text className="text-muted">
                        Upload solution files, additional resources, or assignment materials.
                      </Form.Text>
                    </Form.Group>
                    <Button type="submit" disabled={isSubmitting || !selectedFile}>
                      {isSubmitting ? 'Uploading...' : 'Upload Materials'}
                    </Button>
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                  </Form>
                </Card>
                )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const FeedbackDisplay = ({ feedback }) => {
  if (!feedback) return <Alert variant="info">No feedback available yet.</Alert>;

  console.log(feedback);

  const { overall_details = {}, criteria = [], overall_evaluation = {} } = feedback;
  const safeFixed = (v, digits = 1) => {
    const n = parseFloat(v);
    return !isNaN(n) && isFinite(n) ? n.toFixed(digits) : '0.0';
  };
  const totalMarkRaw = overall_evaluation?.mark_out_of_20 ?? overall_evaluation?.total_mark;
  const totalMark = parseFloat(totalMarkRaw);
  const maxMark = parseFloat(overall_evaluation?.maxMark ?? 20);
  const percent = !isNaN(totalMark) && !isNaN(maxMark) && maxMark > 0 ? Math.round((totalMark / maxMark) * 100) : 0;
  const criteriaList = Array.isArray(criteria)
    ? criteria
    : Object.values(criteria || {});

  return (
    <div>
    <p>
      <strong>Grade:</strong>
      <Badge bg="primary" className="ms-2">{percent}%</Badge>
    </p>
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
                    {safeFixed(totalMark, 1, '0.0')}
                  </div>
                  <div className="flex-grow-1">
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${percent}%` }}
                        aria-valuenow={totalMark}
                        aria-valuemin="0"
                        aria-valuemax={maxMark}
                      ></div>
                    </div>
                    <small className="text-muted">out of {overall_evaluation.maxMark} points</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded h-100">
                <h6>Details</h6>
                <ul className="list-unstyled">
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
            {criteriaList.map((details, idx) => (
              <div key={details.criterion || details.name || idx} className="col-md-6 mb-3">
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">{details.criterion || details.name || 'Criterion'}</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary rounded-pill me-2">
                        {details.mark} pts
                      </span>
                      <small className="text-muted">/ {details.maxMark} possible</small>
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

        {/* Borderline Decisions */}
        {overall_evaluation.marker_notes?.borderline_decisions?.length > 0 && (
          <section className="mb-4">
            <h5 className="text-primary mb-3">
              <i className="fas fa-scroll me-2"></i>Borderline Decisions
            </h5>
            <Card className="border-info">
              <Card.Body className="bg-light-info">
                <ul>
                  {overall_evaluation.marker_notes.borderline_decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </section>
        )}

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
                  <p className="mb-0">{overall_evaluation.feedback_for_improvement || overall_evaluation['feedback for improvement'] || 'No specific improvement feedback provided.'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>
      </Card.Body>
    </Card>
    </div>
  );
};

export default AssignmentDetailsPage;
