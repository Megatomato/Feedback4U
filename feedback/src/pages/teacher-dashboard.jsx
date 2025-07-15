import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { courseAPI, assignmentAPI, teacherAPI } from '../services/api';
import { CourseCard, AssignmentCard } from '../components/Cards';
import { AssignmentModal } from '../components/Forms';
import { AnalyticsChart } from '../components/Chart';
import { StudentNav } from '../components/Navbar';

const TeacherDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch teacher-specific data using the new endpoints
        const [coursesRes, statisticsRes] = await Promise.all([
          teacherAPI.getCourses(),
          teacherAPI.getStatistics()
        ]);

        console.log('Courses response:', coursesRes);
        console.log('Statistics response:', statisticsRes);

        // Ensure we have valid data before setting state
        const coursesData = coursesRes.data || [];
        const statisticsData = statisticsRes.data || null;

        setCourses(coursesData);
        setStatistics(statisticsData);
        if (coursesData.length > 0) {
          try {
            const assignmentsPromises = coursesData.map(c =>
              assignmentAPI.getForCourse(c.course_id).then(res => res.data || [])
            );
            const assignmentsByCourse = await Promise.all(assignmentsPromises);
            const flattenedAssignments = assignmentsByCourse.flat();
            setAssignments(flattenedAssignments);
            console.log("Fetched assignments:", flattenedAssignments); // Log the actual data
          } catch (error) {
            console.error("Error fetching assignments:", error);
            setAssignments([]);
          }
        } else {
          setAssignments([]);
        }

      } catch (error) {
        console.error("Failed to fetch data", error);
        console.error("Error details:", error.response?.data || error.message);
        setError("Failed to load dashboard data. Please try again.");

        // Set safe defaults on error
        setCourses([]);
        setStatistics(null);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateAssignment = async (formData) => {
    try {
      await assignmentAPI.create({
        assignment_name: formData.title,
        assignment_description: formData.description,
        assignment_due_date: formData.dueDate,
        assignment_course_id: Number(formData.courseId),
      });

      // Refresh both courses (to update assignment counts) and assignments
      const [coursesRes, assignmentsRes] = await Promise.all([
        teacherAPI.getCourses(),
        assignmentAPI.getForCourse(formData.courseId)
      ]);

      setCourses(coursesRes.data || []);
      const newAssignments = assignments.filter(a => a.assignment_course_id !== Number(formData.courseId)).concat(assignmentsRes.data || []);
      setAssignments(newAssignments);

      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create assignment", error);
      alert("Failed to create assignment. Check console for details.");
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  if (loading) {
    return (
      <div>
        <StudentNav/>
        <Container className="my-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading dashboard...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
    <StudentNav/>
    <Container className="my-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <Row className="align-items-center mb-4">
          <Col md={8}>
            <h1 className="dashboard-title">Teacher Dashboard</h1>
            <p className="dashboard-subtitle">
              {statistics ? (
                <>
                  Welcome, <strong>{statistics.teacher_name}</strong> | {statistics.school_name}
                </>
              ) : (
                'Manage assignments and track student progress'
              )}
            </p>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Assignment
            </Button>
          </Col>
        </Row>
      </div>

      {/* Analytics Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Course Analytics</h5>
            </Card.Header>
            <Card.Body>
              <AnalyticsChart />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Course Overview */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Course Overview</h5>
            </Card.Header>
            <Card.Body>
              {courses && courses.length > 0 ? (
                <Row>
                  {courses.map((course) => (
                    <Col md={6} lg={4} key={course.course_id} className="mb-3">
                      <div
                        className="border rounded p-3 h-100 clickable-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/course/${course.course_id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(`/course/${course.course_id}`);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <h6 className="text-primary">{course.course_name}</h6>
                        <div className="small text-muted mb-2">
                          {course.course_description}
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="small">Assignments:</span>
                          <span className="small fw-bold">{course.assignment_count}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="small">Students:</span>
                          <span className="small fw-bold">{course.total_students}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="small">Submissions:</span>
                          <span className="small fw-bold">{course.total_submissions}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="small">Status:</span>
                          <Badge bg={course.course_is_active ? 'success' : 'secondary'} size="sm">
                            {course.course_is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center text-muted">
                  <p>No courses found. Create your first course to get started!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              {statistics ? (
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.total_courses}</h3>
                      <p className="text-muted mb-0">Total Courses</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.total_assignments}</h3>
                      <p className="text-muted mb-0">Total Assignments</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.total_submissions}</h3>
                      <p className="text-muted mb-0">Total Submissions</p>
                    </div>
                  </Col>
                </Row>
              ) : (
                <div className="text-center text-muted">Loading statistics...</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Courses and Assignments */}
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">My Courses</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {courses && courses.map((course) => (
                  <Col md={6} key={course.course_id} className="mb-3">
                    <CourseCard
                      course={course}
                      userRole="teacher"
                      onClick={() => handleCourseClick(course.course_id)}
                    />
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Due Soon</h5>
            </Card.Header>
            <Card.Body>
              {assignments.slice(0, 3).map((assignment) => {
                const course = courses.find(c => c.course_id === assignment.assignment_course_id);
                return (
                  <AssignmentCard
                    key={assignment.assignment_id}
                    assignment={assignment}
                    courseName={course?.course_name}
                    onClick={() => handleAssignmentClick(assignment.assignment_id)}
                  />
                );
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Assignment Modal */}
      <AssignmentModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSubmit={handleCreateAssignment}
        courses={courses}
      />
    </Container>
    </div>
  );
};

export default TeacherDashboard;
