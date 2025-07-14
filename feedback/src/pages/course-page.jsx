import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, assignmentAPI } from '../services/api';
import { AssignmentCard } from '../components/Cards';
import { StudentNav } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseRes = await courseAPI.getById(id);
        setCourse(courseRes.data);
        const assignmentsRes = await assignmentAPI.getForCourse(id);
        setAssignments(assignmentsRes.data);
      } catch (error) {
        console.error("Failed to fetch course data:", error);
      }
    };
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  if (!course) {
    return (
      <Container className="py-4">
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
      </Container>
    );
  }

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  const completionRate = course.completionRate || 75; // Placeholder
  const students = course.students || 0; // Placeholder

  return (
    <div>
    <StudentNav />
    <Container className="my-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-3">
          <i className="bi bi-arrow-left">
            Back to Dashboard
          </i>
        </Button>
        <div>
          <h1 className="mb-0">{course.course_name}</h1>
          <p className="text-muted mb-0">{course.course_description}</p>
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
                    courseName={course.course_name}
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
              <h6 className="mb-0">Course Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Students:</span>
                <strong>{students}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Assignments:</span>
                <strong>{assignments.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Completion Rate:</span>
                <strong>{completionRate}%</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Average Submissions:</span>
                <strong>
                  {/* Placeholder */}
                  0
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default CoursePage;
