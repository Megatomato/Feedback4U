import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { courseAPI, assignmentAPI } from '../services/api';
import { CourseCard, AssignmentCard } from '../components/Cards';
import { AssignmentModal } from '../components/Forms';
import { AnalyticsChart } from '../components/Chart';
import { StudentNav } from '../components/Navbar';

const TeacherDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseAPI.getAll();
        setCourses(coursesRes.data);
        
        // Fetch assignments for each course - might be inefficient for many courses
        const assignmentsPromises = coursesRes.data.map(c => assignmentAPI.getForCourse(c.course_id));
        const assignmentsByCourse = await Promise.all(assignmentsPromises);
        setAssignments(assignmentsByCourse.flatMap(res => res.data));

      } catch (error) {
        console.error("Failed to fetch data", error);
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
      // Re-fetch assignments
      const assignmentsRes = await assignmentAPI.getForCourse(formData.courseId);
      const newAssignments = assignments.filter(a => a.assignment_course_id !== Number(formData.courseId)).concat(assignmentsRes.data);
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
                    <h3 className="text-primary">{courses.length}</h3>
                    <p className="text-muted mb-0">Total Courses</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{assignments.length}</h3>
                    <p className="text-muted mb-0">Total Assignments</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {courses.reduce((sum, course) => sum + course.students, 0)}
                    </h3>
                    <p className="text-muted mb-0">Total Students</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">
                      {Math.round(courses.reduce((sum, course) => sum + course.completionRate, 0) / courses.length)}%
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
                {courses.map((course) => (
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
              <h5 className="mb-0">Recent Assignments</h5>
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
