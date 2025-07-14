import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, assignmentAPI } from '../services/api';
import { AssignmentCard } from '../components/Cards';
import { StudentNav } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const StudentCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseDetails, setCourseDetails] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const [courseRes, assignmentsRes] = await Promise.all([
          courseAPI.getDetails(id),
          assignmentAPI.getForCourse(id)
        ]);
        
        setCourseDetails(courseRes.data);
        setAssignments(assignmentsRes.data || []);
      } catch (error) {
        console.error("Failed to fetch course data:", error);
        setError("Failed to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  if (loading) {
    return (
      <div>
        <StudentNav />
        <Container className="my-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading course details...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !courseDetails) {
    return (
      <div>
        <StudentNav />
        <Container className="py-4">
          <div className="alert alert-danger">
            <h4>Course not found</h4>
            <p>{error || "The course you're looking for doesn't exist."}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <StudentNav />
      <Container className="my-4">
        <div className="d-flex align-items-center mb-4">
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-3">
            <i className="bi bi-arrow-left"></i>
          </Button>
          <div>
            <h1 className="mb-0">{courseDetails.course_name}</h1>
            <p className="text-muted mb-0">{courseDetails.course_description}</p>
            <small className="text-muted">
              Instructor: {courseDetails.teacher_name} ({courseDetails.teacher_email})
            </small>
          </div>
        </div>
        
        <Row>
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Course Assignments</h5>
                <small className="text-muted">{assignments.length} assignments</small>
              </Card.Header>
              <Card.Body>
                {assignments.length > 0 ? (
                  assignments.map(assignment => (
                    <AssignmentCard
                      key={assignment.assignment_id}
                      assignment={assignment}
                      courseName={courseDetails.course_name}
                      onClick={() => handleAssignmentClick(assignment.assignment_id)}
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
                <h6 className="mb-0">Course Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Students:</span>
                  <strong>{courseDetails.total_students}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Assignments:</span>
                  <strong>{courseDetails.total_assignments}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Course Status:</span>
                  <Badge bg={courseDetails.course_is_active ? 'success' : 'secondary'}>
                    {courseDetails.course_is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Instructor:</span>
                  <strong>{courseDetails.teacher_name}</strong>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentCourseDetail; 