import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

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
      // NOTE: API call would be here
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      setValidated(true);
    } catch (error) {
      console.error('Signup error:', error);
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
      // NOTE: API call would be here
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      setValidated(true);
    } catch (error) {
      console.error('Signup error:', error);
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

export { AddStudentForm, AddTeacherForm };
