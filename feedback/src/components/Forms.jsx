import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';

import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AddStudentForm() {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phoneNumber: ""
  });

  const [validated, setValidated] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      phoneNumber: ""
    });
    setValidated(false);
    setSubmitSuccess(false);
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);

    try {

      console.log('Form submitted:', formData);
      const result = await authAPI.registerStudent(formData);

      if (result.success) {
        setSubmitSuccess(true);
        setValidated(true);
      }

    } catch (error) {
      console.error('Signup error:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
     { submitSuccess ? (
       <Alert variant="success" className="text-center">
         <Alert.Heading>Student Created Successfully</Alert.Heading>
         <p>Need to think about how we are dealing with user / password here</p>
         <Button variant="primary" onClick={handleReset}>Add new</Button>
       </Alert>
     ) : (
       <>
         <Form noValidate validated={validated} onSubmit={handleSubmit}>
           <Form.Group controlId="id" className="mb-3">
             <Form.Label>Student ID</Form.Label>
             <Form.Control
               required
               type="text"
               placeholder="47439511"
               name="id"
               value={formData.id}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide the student's ID.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="name" className="mb-3">
             <Form.Label>Full Name</Form.Label>
             <Form.Control
               required
               type="text"
               placeholder="Richard Thomas"
               name="name"
               value={formData.name}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide the student's name.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="phoneNumber" className="mb-3">
             <Form.Label>Phone Number</Form.Label>
             <Form.Control
               required
               type="phoneNumber"
               placeholder="0433823736"
               name="phoneNumber"
               value={formData.phoneNumber}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide a valid phone number.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="email" className="mb-3">
             <Form.Label>Email Address</Form.Label>
             <Form.Control
               required
               type="email"
               placeholder="john@uq.edu.au"
               name="email"
               value={formData.email}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide a valid email.
             </Form.Control.Feedback>
           </Form.Group>
           <div className="d-grid gap-2 mt-4">
             <Button
               variant="primary"
               type="submit"
               size="lg"
               disabled={isSubmitting}
             >
               {isSubmitting ? 'Adding Student...' : 'Add Student'}
             </Button>
           </div>
         </Form>
       </>
     )}
    </div>
    );
};

function AddTeacherForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });

  const [validated, setValidated] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      phoneNumber: ""
    });
    setValidated(false);
    setSubmitSuccess(false);
    setIsSubmitting(false);
  };


  const handleSubmit = async (e) => {

    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);

    try {

      console.log('Form submitted:', formData);
      const result = await authAPI.registerTeacher(formData);

      if (result.success) {
        setSubmitSuccess(true);
        setValidated(true);
      }

    } catch (error) {
      console.error('Signup error:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
     { submitSuccess ? (
       <Alert variant="success" className="text-center">
         <Alert.Heading>Teacher Created Successfully</Alert.Heading>
         <p>Need to think about how we are dealing with user / password here</p>
         <Button variant="primary" onClick={handleReset}>Add new</Button>
       </Alert>
     ) : (
       <>
         <Form noValidate validated={validated} onSubmit={handleSubmit}>
           <Form.Group controlId="name" className="mb-3">
             <Form.Label>Full Name</Form.Label>
             <Form.Control
               required
               type="text"
               placeholder="Richard Thomas"
               name="name"
               value={formData.name}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide the teacher's name.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="email" className="mb-3">
             <Form.Label>Email Address</Form.Label>
             <Form.Control
               required
               type="email"
               placeholder="john@uq.edu.au"
               name="email"
               value={formData.email}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide a valid email.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="phoneNumber" className="mb-3">
             <Form.Label>Phone Number</Form.Label>
             <Form.Control
               required
               type="phoneNumber"
               placeholder="0433823736"
               name="phoneNumber"
               value={formData.phoneNumber}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide a valid phone number.
             </Form.Control.Feedback>
           </Form.Group>
           <div className="d-grid gap-2 mt-4">
             <Button
               variant="primary"
               type="submit"
               size="lg"
               disabled={isSubmitting}
             >
               {isSubmitting ? 'Adding Teacher...' : 'Add Teacher'}
             </Button>
           </div>
         </Form>
       </>
     )}
    </div>
    );
};

const AssignmentModal = ({ show, onHide, onSubmit, courses = [] }) => {
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ courseId: '', title: '', description: '', dueDate: '' });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Assignment</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Course</Form.Label>
            <Form.Select
              name="courseId"
              value={form.courseId}
              onChange={handleChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assignment Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Enter assignment title"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Enter assignment description"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create Assignment
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export { AddStudentForm, AddTeacherForm, AssignmentModal };
