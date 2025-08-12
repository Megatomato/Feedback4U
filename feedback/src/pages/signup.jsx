import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandNav } from '../components/Navbar.jsx'

const SignupPage = () => {
  const navigate = useNavigate();
  const { registerAdmin } = useAuth();

  // NOTE: the data that is being sent
  const [formData, setFormData] = useState({
    schoolName: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'mid'
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
      console.log('Form submitted:', formData);

      // Call the actual registration API
      const result = await registerAdmin(formData);

      if (result.success) {
        setSubmitSuccess(true);
        setValidated(true);

        // Redirect after successful signup
        setTimeout(() => navigate('/login'), 2000);
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Show error to user
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      alert('Registration failed: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstFeature = ["1 Teacher", "4 Classes per Teacher", "Up to 10 Students per Class"];
  const seconFeature = ["Up to 100 Teachers", "Up to 4 Class per Teacher", "Up to 35 Students per Class"]
  const thirdFeature = ["Up to 250 Teachers", "Up to 6 Classes per Teacher", "Up to 250 per Class",
                          "API access / supoort for custom workflows, UI or integration with custom systems",
                          "Add ons avaliable for more teachers, classes and students"]
  const plans = [
    { id: 'sml', name: 'Home School Package', price: '$9.99/month', features: firstFeature },
    { id: 'mid', name: 'Mid Sized School', price: '$59.99/month', features: seconFeature },
    { id: 'lrg', name: 'Large School / University', price: '$694.20/month', features: thirdFeature }
  ];

  const selectedPlan = plans.find(plan => plan.id === formData.plan);

  return (
    <div>
      <LandNav/>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 >Join Feedback4U Today!</h2>
                </div>


                {submitSuccess ? (
                  <Alert variant="success" className="text-center">
                    <Alert.Heading>Account Created Successfully!</Alert.Heading>
                    <p>Welcome aboard! Redirecting you to login page...</p>
                  </Alert>
                ) : (
                  <>

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                      <Form.Group controlId="schoolName" className="mb-3">
                        <Form.Label>School Name</Form.Label>
                        <Form.Control
                          required
                          type="text"
                          placeholder="Dalian Neusoft University of Information"
                          name="schoolName"
                          value={formData.schoolName}
                          onChange={handleChange}
                        />
                        <Form.Control.Feedback type="invalid">
                          Please provide the school name.
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

                      <Form.Group controlId="password" className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          required
                          type="password"
                          placeholder="••••••••"
                          name="password"
                          minLength="8"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <Form.Control.Feedback type="invalid">
                          Password must be at least 8 characters.
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group controlId="confirmPassword" className="mb-4">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          required
                          type="password"
                          placeholder="••••••••"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          isInvalid={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                        />
                        <Form.Control.Feedback type="invalid">
                          Passwords don't match.
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group controlId="plan" className="mb-4">
                        <Form.Label>Select Your Plan</Form.Label>
                        <Form.Select
                          name="plan"
                          value={formData.plan}
                          onChange={handleChange}
                          required
                          className="mb-3"
                        >
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - {plan.price}
                            </option>
                          ))}
                        </Form.Select>

                        {selectedPlan && (
                          <div className="p-3 bg-light rounded">
                            <h6 className="mb-2">{selectedPlan.name} Features:</h6>
                            <ul className="mb-0">
                              {selectedPlan.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Form.Group>

                      <div className="d-grid gap-2 mt-4">
                        <Button
                          variant="primary"
                          type="submit"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </div>
                    </Form>

                    <div className="text-center mt-4">
                      <p className="text-muted">
                        Already have an account? <a href="/login">Sign in</a>
                      </p>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SignupPage;
