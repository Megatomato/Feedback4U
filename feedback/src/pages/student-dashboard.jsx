import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sampleData } from '../data/sampleData';
import { getDaysUntilDue } from '../utils/helpers';
import { StudentNav } from '../components/Navbar';
import { studentAPI } from '../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for real API data
  const [courses, setCourses] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get student's data (keeping some hardcoded for assignments as requested)
  const student = sampleData.students.find(s => s.id === user.id);

  // Fetch real data from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesRes, statisticsRes] = await Promise.all([
          studentAPI.getCourses(),
          studentAPI.getStatistics()
        ]);

        console.log('Student courses response:', coursesRes);
        console.log('Student statistics response:', statisticsRes);

        setCourses(coursesRes.data || []);
        setStatistics(statisticsRes.data || null);

      } catch (error) {
        console.error("Failed to fetch student data", error);
        console.error("Error details:", error.response?.data || error.message);
        setError("Failed to load dashboard data. Please try again.");
        
        // Set safe defaults on error
        setCourses([]);
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Get recent submissions
  const recentSubmissions = sampleData.submissions
    .filter(submission => submission.studentId === user.id)
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
          <Col>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-subtitle">
              {statistics ? (
                <>
                  Welcome, <strong>{statistics.student_name}</strong> | {statistics.school_name}
                </>
              ) : (
                "Here's your academic overview"
              )}
            </p>
            {statistics && statistics.student_email && (
              <small className="text-muted">{statistics.student_email}</small>
            )}
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
                {courses && courses.length > 0 ? (
                  courses.map(course => {
                    // Calculate progress based on submitted vs total assignments
                    const progressRate = course.total_assignments > 0 
                      ? Math.round((course.submitted_assignments / course.total_assignments) * 100) 
                      : 0;
                    
                    return (
                      <div
                        key={course.course_id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleCourseClick(course.course_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-1">{course.course_name}</h6>
                          <Badge bg={course.course_is_active ? 'success' : 'secondary'}>
                            {course.course_is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <small className="text-muted d-block mb-2">{course.teacher_name}</small>
                        <div>
                          <small className="text-muted">
                            Assignments: {course.submitted_assignments}/{course.total_assignments}
                          </small>
                          <ProgressBar
                            now={progressRate}
                            variant={progressRate >= 80 ? 'success' : progressRate >= 60 ? 'warning' : 'danger'}
                            size="sm"
                            className="mt-1"
                          />
                        </div>
                        {course.average_grade && (
                          <small className="text-success">
                            Average Grade: {course.average_grade}%
                          </small>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-muted">No courses found</div>
                )}
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
              {statistics ? (
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h3 className="text-primary">
                        {statistics.overall_average_grade ? `${statistics.overall_average_grade}%` : 'N/A'}
                      </h3>
                      <p className="text-muted mb-0">Average Grade</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.total_submissions}</h3>
                      <p className="text-muted mb-0">Total Submissions</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.total_courses}</h3>
                      <p className="text-muted mb-0">Enrolled Courses</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h3 className="text-primary">{statistics.pending_assignments}</h3>
                      <p className="text-muted mb-0">Pending Assignments</p>
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
    </Container>
    </div>
  );
};

export default StudentDashboard;
