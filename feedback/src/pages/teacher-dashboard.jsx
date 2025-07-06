import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { sampleData } from '../data/sampleData';
import { CourseCard, AssignmentCard } from '../components/Cards';
import { AssignmentModal } from '../components/Forms';
import { AnalyticsChart } from '../components/Chart';
import { StudentNav } from '../components/Navbar';

const TeacherDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const handleCreateAssignment = (formData) => {
    const course = sampleData.courses.find(c => c.id === Number(formData.courseId));
    alert(`Assignment "${formData.title}" created for ${course ? course.name : 'course'}`);
    setShowCreateModal(false);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  return (
    <div>
    <StudentNav/>
    <Container className="my-4">
      {/* Header */}
      <div className="dashboard-header">
        <Row className="align-items-center mb-4">
          <Col md={8}>
            <h1 className="dashboard-title">Teacher Dashboard</h1>
            <p className="dashboard-subtitle">Manage assignments and track student progress</p>
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

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{sampleData.courses.length}</h3>
                    <p className="text-muted mb-0">Total Courses</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{sampleData.assignments.length}</h3>
                    <p className="text-muted mb-0">Total Assignments</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {sampleData.courses.reduce((sum, course) => sum + course.students, 0)}
                    </h3>
                    <p className="text-muted mb-0">Total Students</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {Math.round(sampleData.courses.reduce((sum, course) => sum + course.completionRate, 0) / sampleData.courses.length)}%
                    </h3>
                    <p className="text-muted mb-0">Avg Completion</p>
                  </div>
                </Col>
              </Row>
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
                {sampleData.courses.map((course) => (
                  <Col md={6} key={course.id} className="mb-3">
                    <CourseCard
                      course={course}
                      userRole="teacher"
                      onClick={() => handleCourseClick(course.id)}
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
              <h5 className="mb-0">Recent Assignments</h5>
            </Card.Header>
            <Card.Body>
              {sampleData.assignments.slice(0, 3).map((assignment) => {
                const course = sampleData.courses.find(c => c.id === assignment.courseId);
                return (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    courseName={course?.name}
                    onClick={() => handleAssignmentClick(assignment.id)}
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
      />
    </Container>
    </div>
  );
};

export default TeacherDashboard;
