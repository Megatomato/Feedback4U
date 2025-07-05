import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CourseCard } from '../components/Cards';
import { sampleData } from '../data/sampleData';

const CoursesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <Container className="my-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-2">Courses</h1>
          <p className="text-muted">
            {currentUser.role === 'teacher' ? 'Manage your courses' : 'Your enrolled courses'}
          </p>
        </Col>
      </Row>

      <Row>
        {sampleData.courses.map(course => (
          <Col key={course.id} lg={3} md={6} className="mb-4">
            <CourseCard
              course={course}
              userRole={currentUser.role}
              onClick={() => handleCourseClick(course.id)}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CoursesPage;
