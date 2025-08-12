import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';

import { authAPI, courseAPI, enrollmentAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAdminId } from '../context/AdminProviders';

function UnenrollStudentForm({ onUnenroll }) {
  const [formData, setFormData] = useState({
    school_student_id: "",
    course_code: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing enrollment details when fields change
    if (enrollmentDetails) setEnrollmentDetails(null);
    if (error) setError(null);
  };

  const fetchEnrollmentDetails = async () => {
    try {
      const response = await enrollmentAPI.getBySchoolIdAndCourse(
        formData.school_student_id,
        formData.course_code
      );
      setEnrollmentDetails(response.data);
      setError(null);
    } catch (err) {
      setEnrollmentDetails(null);
      setError(err.response?.data?.detail || 'Enrollment not found. Please check the student ID and course code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // If we don't have enrollment details yet, fetch them first
    if (!enrollmentDetails) {
      await fetchEnrollmentDetails();
      return;
    }

    // Proceed with unenrollment
    setIsSubmitting(true);
    try {
      await enrollmentAPI.delete(
        formData.school_student_id,
        formData.course_code
      );
      onUnenroll({
        studentId: formData.school_student_id,
        courseCode: formData.course_code
      });
    } catch (error) {
      console.error('Unenrollment error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unenrollment failed';
      setError('Unenrollment failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Group controlId="school_student_id" className="mb-3">
        <Form.Label>Student School ID</Form.Label>
        <Form.Control
          required
          type="text"
          name="school_student_id"
          value={formData.school_student_id}
          onChange={handleChange}
          placeholder="Enter student's school ID"
        />
        <Form.Control.Feedback type="invalid">
          Please provide a student ID.
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="course_code" className="mb-3">
        <Form.Label>Course Code</Form.Label>
        <Form.Control
          required
          type="text"
          name="course_code"
          value={formData.course_code}
          onChange={handleChange}
          placeholder="Enter course code"
        />
        <Form.Control.Feedback type="invalid">
          Please provide a course code.
        </Form.Control.Feedback>
      </Form.Group>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {enrollmentDetails && (
        <Alert variant="info" className="mb-3">
          <p>
            Found enrollment: <strong>{enrollmentDetails.student_name}</strong> (ID: {formData.school_student_id}) in <strong>{enrollmentDetails.course_name}</strong> (Code: {formData.course_code})
          </p>
        </Alert>
      )}

      <div className="d-grid gap-2 mt-4">
        <Button
          variant={enrollmentDetails ? "warning" : "primary"}
          type="submit"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' :
           enrollmentDetails ? 'Confirm Unenrollment' : 'Find Enrollment'}
        </Button>
      </div>
    </Form>
  );
}



function EditCourseForm({ course, onUpdate }) {
  const [formData, setFormData] = useState({
    name: course?.name || "",
    description: course?.description || "",
    teacher_email: course?.teacher_email || ""
  });

  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await courseAPI.update(course.course_id, formData);
      onUpdate(result.data);
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Update failed';
      alert('Update failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Course Name / Code</Form.Label>
        <Form.Control
          required
          type="text"
          placeholder="CSSE6400"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <Form.Control.Feedback type="invalid">
          Please provide the course's name.
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          type="description"
          placeholder="Software Architecture"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
        <Form.Control.Feedback type="invalid">
          Please provide a description.
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group controlId="teacher_email" className="mb-3">
        <Form.Label>Teacher Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="teacher@uq.edu.au"
          name="teacher_email"
          value={formData.teacher_email}
          onChange={handleChange}
        />
        <Form.Control.Feedback type="invalid">
          Please provide the email of the teacher.
        </Form.Control.Feedback>
      </Form.Group>
      <div className="d-grid gap-2 mt-4">
        <Button
          variant="primary"
          type="submit"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Course'}
        </Button>
      </div>
    </Form>
  );
}

function EditTeacherForm({ teacher, onUpdate }) {
  const [formData, setFormData] = useState({
    name: teacher?.name || "",
    email: teacher?.email || "",
    phoneNumber: teacher?.phoneNumber || ""
  });

  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await authAPI.updateTeacher(teacher.id, formData);
      onUpdate(result.data);
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Update failed';
      alert('Update failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          type="tel"
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
          {isSubmitting ? 'Updating...' : 'Update Teacher'}
        </Button>
      </div>
    </Form>
  );
}

function EditStudentForm({ student, onUpdate }) {
  const [formData, setFormData] = useState({
    id: student?.id || "",
    name: student?.name || "",
    email: student?.email || "",
    phoneNumber: student?.phoneNumber || ""
  });

  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await authAPI.updateStudent(student.id, formData);
      onUpdate(result.data);
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Update failed';
      alert('Update failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      </Form.Group>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Full Name</Form.Label>
        <Form.Control
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
          type="tel"
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
          {isSubmitting ? 'Updating...' : 'Update Student'}
        </Button>
      </div>
    </Form>
  );
}


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
  const [studentData, setStudentData] = useState(null); // Store created student data

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
    setStudentData(null);
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

      if (result.data) {
        setStudentData(result.data); // Store the response data including password
        setSubmitSuccess(true);
        setValidated(true);
      }

    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      alert('Registration failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
     { submitSuccess ? (
       <Alert variant="success" className="text-center">
         <Alert.Heading>Student Created Successfully</Alert.Heading>
         <div className="mb-3">
           <p><strong>Name:</strong> {studentData.name}</p>
           <p><strong>Email:</strong> {studentData.email}</p>
           <p><strong>Temporary Password:</strong>
             <code className="ms-2 p-2 bg-light text-danger">
               {studentData.generated_password}
             </code>
           </p>
         </div>
         <Alert variant="warning" className="mb-3">
           <small>
             <strong>Important:</strong> Please share this temporary password with the student securely.
             They should change it after their first login.
           </small>
         </Alert>
         <Button variant="primary" onClick={handleReset}>Add Another Student</Button>
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
               type="tel"
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
               {isSubmitting ? 'Creating Student...' : 'Create Student with Auto-Generated Password'}
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
  const [teacherData, setTeacherData] = useState(null); // Store created teacher data

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: ""
    });
    setValidated(false);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setTeacherData(null);
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

      if (result.data) {
        setTeacherData(result.data); // Store the response data including password
        setSubmitSuccess(true);
        setValidated(true);
      }

    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      alert('Registration failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
     { submitSuccess ? (
       <Alert variant="success" className="text-center">
         <Alert.Heading>Teacher Created Successfully</Alert.Heading>
         <div className="mb-3">
           <p><strong>Name:</strong> {teacherData.name}</p>
           <p><strong>Email:</strong> {teacherData.email}</p>
           <p><strong>Temporary Password:</strong>
             <code className="ms-2 p-2 bg-light text-danger">
               {teacherData.generated_password}
             </code>
           </p>
         </div>
         <Alert variant="warning" className="mb-3">
           <small>
             <strong>Important:</strong> Please share this temporary password with the teacher securely.
             They should change it after their first login.
           </small>
         </Alert>
         <Button variant="primary" onClick={handleReset}>Add Another Teacher</Button>
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
               type="tel"
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
               {isSubmitting ? 'Creating Teacher...' : 'Create Teacher with Auto-Generated Password'}
             </Button>
           </div>
         </Form>
       </>
     )}
    </div>
    );
};

function AddCourseForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacher_email: ""
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
      name: "",
      description: "",
      teacher_email: ""
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

      // Debug: Check if user is authenticated and what role they have
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user data:', currentUser);
      console.log('User role:', currentUser.role);
      console.log('Token:', localStorage.getItem('token'));

      // Also fetch fresh user data from /me endpoint
      try {
        const { authAPI } = await import('../services/api');
        const freshUserData = await authAPI.getCurrentUser();
        console.log('Fresh user data from /me:', freshUserData.data);
      } catch (err) {
        console.error('Failed to get current user:', err);
      }

      const result = await courseAPI.create(formData);

      setSubmitSuccess(true);
      setValidated(true);

    } catch (error) {
      console.error('Course creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || error.message || 'Course creation failed';
      alert('Course creation failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
     { submitSuccess ? (
       <Alert variant="success" className="text-center">
         <Alert.Heading>Course Created Successfully</Alert.Heading>
         <Button variant="primary" onClick={handleReset}>Add new</Button>
       </Alert>
     ) : (
       <>
         <Form noValidate validated={validated} onSubmit={handleSubmit}>
           <Form.Group controlId="name" className="mb-3">
             <Form.Label>Course Name / Code</Form.Label>
             <Form.Control
               required
               type="text"
               placeholder="CSSE6400"
               name="name"
               value={formData.name}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide the course's name.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="description" className="mb-3">
             <Form.Label>Description</Form.Label>
             <Form.Control
               required
               type="description"
               placeholder="Software Architecture"
               name="description"
               value={formData.description}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide a description.
             </Form.Control.Feedback>
           </Form.Group>
           <Form.Group controlId="phoneNumber" className="mb-3">
             <Form.Label>Teacher Email</Form.Label>
             <Form.Control
               required
               type="email"
               placeholder="teacher@uq.edu.au"
               name="teacher_email"
               value={formData.teacher_email}
               onChange={handleChange}
             />
             <Form.Control.Feedback type="invalid">
               Please provide the email of the teacher.
             </Form.Control.Feedback>
           </Form.Group>
           <div className="d-grid gap-2 mt-4">
             <Button
               variant="primary"
               type="submit"
               size="lg"
               disabled={isSubmitting}
             >
               {isSubmitting ? 'Adding Course...' : 'Add Course'}
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

function EnrollStudentForm() {
  const [formData, setFormData] = useState({
    school_student_id: "",
    course_id: ""
  });

  const [validated, setValidated] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses when component mounts
  const { user } = useAuth();
  const adminId = useAdminId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseAPI.getAdminSchoolCourses();
        setCourses(coursesRes.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'course_id' ? parseInt(value) || value : value
    }));
  };

  const handleReset = () => {
    setFormData({
      school_student_id: "",
      course_id: ""
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
      console.log('Enrollment form submitted:', formData);
      const result = await enrollmentAPI.createBySchoolId({
        school_student_id: parseInt(formData.school_student_id),
        course_id: parseInt(formData.course_id)
      });

      setSubmitSuccess(true);
      setValidated(true);

    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Enrollment failed';
      alert('Enrollment failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div>
      {submitSuccess ? (
        <Alert variant="success" className="text-center">
          <Alert.Heading>Student Enrolled Successfully</Alert.Heading>
          <p>The student has been enrolled in the course.</p>
          <Button variant="primary" onClick={handleReset}>Enroll Another Student</Button>
        </Alert>
      ) : (
        <>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group controlId="school_student_id" className="mb-3">
              <Form.Label>Student School ID</Form.Label>
              <Form.Control
                type="number"
                required
                name="school_student_id"
                value={formData.school_student_id}
                onChange={handleChange}
                placeholder="Enter student's school ID..."
                min="1"
              />
              <Form.Control.Feedback type="invalid">
                Please enter a valid student school ID.
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter the student's unique school ID number (not their email or name).
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="course_id" className="mb-3">
              <Form.Label>Select Course</Form.Label>
              <Form.Select
                required
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_name} - {course.teacher_name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Please select a course.
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enrolling Student...' : 'Enroll Student'}
              </Button>
            </div>
          </Form>
        </>
      )}
    </div>
  );
}

export {  UnenrollStudentForm, EditCourseForm, EditTeacherForm, EditStudentForm, AddStudentForm, AddTeacherForm, AddCourseForm, AssignmentModal, EnrollStudentForm };