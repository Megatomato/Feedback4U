import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, assignmentAPI } from '../services/api';
import { AssignmentCard } from '../components/Cards';
import { useAuth } from '../context/AuthContext';
import { TeacherNav, AdminNav } from '../components/Navbar';

const TeacherCourseDetail = () => {
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

  const getNavbarComponent = () => {
    if (user.role === 'teacher') {
      return <TeacherNav />;
    } else if (user.role === 'admin') {
      return <AdminNav />;
    }
    return null;
  };

  if (loading) {
    return (
      <div>
        {getNavbarComponent()}
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
        {getNavbarComponent()}
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
      {getNavbarComponent()}
      <Container className="my-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-3">
              <i className="bi bi-arrow-left">Back to Dashboard</i>
            </Button>
            <div>
              <h1 className="mb-0">{courseDetails.course_name}</h1>
              <p className="text-muted mb-0">{courseDetails.course_description}</p>
              <small className="text-muted">
                Instructor: {courseDetails.teacher_name} ({courseDetails.teacher_email})
              </small>
            </div>
          </div>
          <Badge bg={courseDetails.course_is_active ? 'success' : 'secondary'} className="fs-6">
            {courseDetails.course_is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Course Statistics */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{courseDetails.total_students}</h3>
                <p className="text-muted mb-0">Enrolled Students</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{courseDetails.total_assignments}</h3>
                <p className="text-muted mb-0">Total Assignments</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">
                  {courseDetails.students ?
                    Math.round((courseDetails.students.reduce((sum, s) => sum + s.submitted_assignments > 0 ? 1 : 0, 0) /
                    (courseDetails.students.length * courseDetails.total_assignments)) * 100) || 0 : 0}%
                </h3>
                <p className="text-muted mb-0">Completion Rate</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">
                  {courseDetails.students ?
                    (courseDetails.students.filter(s => s.average_grade !== null).reduce((sum, s) => sum + (s.average_grade || 0), 0) /
                    courseDetails.students.filter(s => s.average_grade !== null).length || 0).toFixed(1) : 'N/A'}
                </h3>
                <p className="text-muted mb-0">Average Grade</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={6}>
            <Card className="mb-4">
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

          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Enrolled Students</h5>
                <small className="text-muted">
                  {courseDetails.students ? courseDetails.students.length : 0} students
                </small>
              </Card.Header>
              <Card.Body className="p-0">
                {courseDetails.students && courseDetails.students.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Student</th>
                          <th>School ID</th>
                          <th>Progress</th>
                          <th>Avg Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseDetails.students.map(student => {
                          const progressPercent = courseDetails.total_assignments > 0
                            ? Math.round((student.submitted_assignments / courseDetails.total_assignments) * 100)
                            : 0;

                          return (
                            <tr key={student.student_id}>
                              <td>
                                <div>
                                  <strong>{student.student_name}</strong>
                                  <br />
                                  <small className="text-muted">{student.student_email}</small>
                                </div>
                              </td>
                              <td>
                                <Badge bg="secondary">{student.school_student_id}</Badge>
                              </td>
                              <td>
                                <div>
                                  <small className="text-muted">
                                    {student.submitted_assignments}/{courseDetails.total_assignments}
                                  </small>
                                  <div className="progress mt-1" style={{ height: '6px' }}>
                                    <div
                                      className={`progress-bar ${progressPercent >= 80 ? 'bg-success' : progressPercent >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                      style={{ width: `${progressPercent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {student.average_grade !== null ? (
                                  <Badge bg={student.average_grade >= 90 ? 'success' : student.average_grade >= 80 ? 'info' : student.average_grade >= 70 ? 'warning' : 'danger'}>
                                    {student.average_grade.toFixed(1)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-3 text-muted text-center">
                    No students enrolled in this course yet
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

export default TeacherCourseDetail;
