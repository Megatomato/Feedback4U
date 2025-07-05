import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { LandNav } from '../components/Navbar.jsx'

//import React, { useState } from 'react';
//import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
//import { useAuth } from '../context/AuthContext';
//import { useNavigate } from 'react-router-dom';
//<Container fluid className="px-4 py-3"></Container>
//const LoginPage = () => {
//  const [formData, setFormData] = useState({ username: '', password: '' });
//  const [error, setError] = useState('');
//  const { login } = useAuth();
//  const navigate = useNavigate();
//
//  const handleChange = (e) => {
//    setFormData({
//      ...formData,
//      [e.target.name]: e.target.value
//    });
//  };
//
//  const handleSubmit = async (e) => {
//    e.preventDefault();
//    setError('');
//
//    if (!formData.username || !formData.password) {
//      setError('Please fill in all fields');
//      return;
//    }
//
//    const success = await login(formData.username.trim(), formData.password.trim());
//    if (success) {
//      navigate('/dashboard');
//    } else {
//      setError('Invalid credentials. Use teacher/password or student/password');
//    }
//  };
//
//  return (
//    <div style={{
//      minHeight: '100vh',
//      backgroundColor: 'var(--rp-base)',
//      display: 'flex',
//      alignItems: 'center',
//      justifyContent: 'center',
//      padding: '20px'
//    }}>
//      <Container>
//        <div className="row justify-content-center">
//          <div className="col-md-6 col-lg-5">
//            <Card style={{
//              backgroundColor: 'var(--rp-surface)',
//              border: '1px solid var(--rp-highlight-med)',
//              borderRadius: '16px',
//              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
//            }}>
//              <Card.Body style={{ padding: '3rem' }}>
//                <div className="text-center mb-5">
//                  <h1 style={{
//                    color: 'var(--rp-iris)',
//                    fontSize: '3rem',
//                    fontWeight: '600',
//                    marginBottom: '1rem'
//                  }}>
//                    Feedback4U
//                  </h1>
//                  <p style={{
//                    color: 'var(--rp-subtle)',
//                    fontSize: '1.1rem',
//                    marginBottom: '0'
//                  }}>
//                    Educational Assignment Management System
//                  </p>
//                </div>
//
//                {error && <Alert variant="danger">{error}</Alert>}
//
//                <Form onSubmit={handleSubmit}>
//                  <Form.Group className="mb-4">
//                    <Form.Label style={{
//                      color: 'var(--rp-text)',
//                      fontWeight: '500',
//                      marginBottom: '0.75rem'
//                    }}>
//                      Username
//                    </Form.Label>
//                    <Form.Control
//                      type="text"
//                      name="username"
//                      value={formData.username}
//                      onChange={handleChange}
//                      required
//                      placeholder="Enter username"
//                      style={{
//                        backgroundColor: 'var(--rp-surface)',
//                        border: '2px solid var(--rp-iris)',
//                        borderRadius: '12px',
//                        padding: '12px 16px',
//                        fontSize: '1rem',
//                        color: 'var(--rp-text)'
//                      }}
//                    />
//                  </Form.Group>
//
//                  <Form.Group className="mb-4">
//                    <Form.Label style={{
//                      color: 'var(--rp-text)',
//                      fontWeight: '500',
//                      marginBottom: '0.75rem'
//                    }}>
//                      Password
//                    </Form.Label>
//                    <Form.Control
//                      type="password"
//                      name="password"
//                      value={formData.password}
//                      onChange={handleChange}
//                      required
//                      placeholder="Enter password"
//                      style={{
//                        backgroundColor: 'var(--rp-surface)',
//                        border: '2px solid var(--rp-highlight-med)',
//                        borderRadius: '12px',
//                        padding: '12px 16px',
//                        fontSize: '1rem',
//                        color: 'var(--rp-text)'
//                      }}
//                    />
//                  </Form.Group>
//
//                  <Button
//                    type="submit"
//                    style={{
//                      width: '100%',
//                      backgroundColor: 'var(--rp-iris)',
//                      border: 'none',
//                      borderRadius: '12px',
//                      padding: '12px',
//                      fontSize: '1.1rem',
//                      fontWeight: '500',
//                      marginBottom: '2rem'
//                    }}
//                  >
//                    Login
//                  </Button>
//                </Form>
//
//                <div style={{
//                  backgroundColor: 'var(--rp-highlight-low)',
//                  border: '1px solid var(--rp-highlight-med)',
//                  borderRadius: '12px',
//                  padding: '1.5rem',
//                  textAlign: 'center'
//                }}>
//                  <div style={{ color: 'var(--rp-text)', marginBottom: '0.5rem' }}>
//                    <strong>Demo Credentials:</strong>
//                  </div>
//                  <div style={{ color: 'var(--rp-iris)', fontWeight: '600' }}>
//                    <strong>Teacher:</strong> teacher / password
//                  </div>
//                  <div style={{ color: 'var(--rp-iris)', fontWeight: '600' }}>
//                    <strong>Student:</strong> student / password
//                  </div>
//                </div>
//              </Card.Body>
//            </Card>
//          </div>
//        </div>
//      </Container>
//    </div>
//  );
//};
//<Container className="app-shell"></Container>
//export default LoginPage;
const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await login(formData.username.trim(), formData.password.trim());
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use teacher/password or student/password');
    }
  };

  return (
    <div>
    <LandNav/>
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h2>Welcome Back</h2>
                <p className="text-muted">Please sign in to continue</p>
              </div>

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group controlId="username" className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    required
                    type="username"
                    placeholder="Enter your username"
                    name="username"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid username.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    required
                    type="password"
                    placeholder="Enter your password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="6"
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must be at least 6 characters.
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex justify-content-between mb-4">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default LoginPage;
