import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CourseCard } from '../components/Cards';
import { StudentNav } from '../components/Navbar';
import { courseAPI } from '../services/api';

const CoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRes = await courseAPI.getAll();
        console.log('Courses response:', coursesRes);
        setCourses(coursesRes.data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
        setCourses([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <StudentNav/>
      <Container className="my-4">
        <Row className="mb-4">
          <Col>
            <h1 className="h3 mb-2">Courses</h1>
            <p className="text-muted">
              {user.role === 'teacher' ? 'Manage your courses' : 'Your enrolled courses'}
            </p>
          </Col>
        </Row>

        <Row>
          {courses && courses.length > 0 ? (
            courses.map(course => (
              <Col key={course.course_id || course.id} lg={3} md={6} className="mb-4">
                <CourseCard
                  course={course}
                  userRole={user.role}
                  onClick={() => handleCourseClick(course.course_id || course.id)}
                />
              </Col>
            ))
          ) : (
            <Col>
              <div className="text-center text-muted">
                <p>No courses available.</p>
              </div>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default CoursesPage;
