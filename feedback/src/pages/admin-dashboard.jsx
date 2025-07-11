import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CourseCard } from '../components/Cards';
import { StudentNav } from '../components/Navbar';
import { courseAPI } from '../services/api';

import Card from "react-bootstrap/Card"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import Modal from "react-bootstrap/Modal"

import { AdminNav }  from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { ATable } from '../components/Data.jsx';
import { AddTeacherForm, AddStudentForm, AddCourseForm } from '../components/Forms.jsx';

const AdminDashPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRes = await courseAPI.getAll();
        setCourses(coursesRes.courses);
      } catch (err) {
        setError(err.message);
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
        <AdminNav/>
        <Container style={{
            paddingBottom: "50px",
        }}>
        <Row>
          <Col>
            <Row>
              <h1> UQ Overview </h1>
              <h4> Total Courses - 123 </h4>
              <h4> Total Teachers - 123 </h4>
              <h4> Total Students - 123 </h4>
              <h4> Average Submissions per Student - 2.3 </h4>
            </Row>
          </Col>
          <Col>
            <Row style={{
              paddingBottom: "50px",
            }}>
              <Col>
                <ManagementButtons
                  studentForm={<AddStudentForm/>}
                  teacherForm={<AddTeacherForm/>}
                  courseForm={<AddCourseForm/>}
                />
              </Col>
            </Row>
            <Card style={{
              maxHeight: "750px",
              overflowY: "auto",
              padding: "10px"
            }}>
              <ATable
                headers={["Course Code", "Teacher", "Students"]}
                data={courses}
              />
            </Card>
          </Col>
        </Row>
        </Container>
    </div>
    );
};

function ManagementButtons({ studentForm, teacherForm, courseForm }) {
  const [activeModal, setActiveModal] = useState(null);

  const handleClose = () => setActiveModal(null);
  const handleShow = (modalType) => setActiveModal(modalType);

  return (
    <Container className="text-center align-mcodedle mx-auto" flucode>
      <Card>
        <Card.Body>
          <Card.Title>
            Management Tools
          </Card.Title>
          <Card.Text>
            <ButtonGroup vertical className="w-100">
              <Button onClick={() => handleShow('addStudent')} className="mb-2">
                Add Students
              </Button>
              <Button variant="outline-primary" onClick={() => handleShow('editStudent')} className="mb-2">
                Edit Student Information
              </Button>
              <Button onClick={() => handleShow('addTeacher')} className="mb-2">
                Add Teachers
              </Button>
              <Button variant="outline-primary" onClick={() => handleShow('editTeacher')} className="mb-2">
                Edit Teacher Information
              </Button>
              <Button onClick={() => handleShow('addCourse')} className="mb-2">
                Add Courses
              </Button>
              <Button variant="outline-primary" onClick={() => handleShow('editCourse')} className="mb-2">
                Edit Course Information
              </Button>
            </ButtonGroup>
          </Card.Text>
        </Card.Body>
      </Card>

      {/* Student Modals */}
      <Modal show={activeModal === 'addStudent'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {studentForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === 'editStudent'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {studentForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Teacher Modals */}
      <Modal show={activeModal === 'addTeacher'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Teachers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teacherForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === 'editTeacher'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Teacher Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teacherForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Course Modals */}
      <Modal show={activeModal === 'addCourse'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Courses</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {courseForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === 'editCourse'} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Course Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {courseForm}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminDashPage;
