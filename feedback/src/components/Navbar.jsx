import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import logo from '../assets/logo.png';
import Image from 'react-bootstrap/Image';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LandNav() {
  return (
    <>
      <Navbar bg="primary" data-bs-theme="dark" fixed="top">
        <Container>
          <Image src={logo} rounded height="35px"/>
          <Navbar.Brand href="/">Feedback4U</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link href="#pricing">Pricing</Nav.Link>
            <Nav.Link href="/signup">Signup</Nav.Link>
            <Nav.Link href="/login">Login</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

function AdminNav() {
  const { user } = useAuth();
  return (
    <>
      <Navbar bg="primary" data-bs-theme="dark" fixed="top">
        <Container>
          <Image src={logo} rounded height="35px"/>
          <Navbar.Brand href="/admin/dashboard">Feedback4U</Navbar.Brand>
          <Nav className='ms-auto'>
            <Logout user={user}/>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

function StudentNav() {
  return (
    <Navbar bg="primary" data-bs-theme="dark" fixed="top">
      <Container>
        <Image src={logo} rounded height="35px"/>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-book me-2"></i>
          Feedback4U
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              <i className="bi bi-house me-1"></i>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/courses">
              <i className="bi bi-journal-text me-1"></i>
              Courses
            </Nav.Link>
          </Nav>
          <Logout/>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

function Logout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log(user)

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
    return (
      <Nav>
        <NavDropdown menuVariant="light" title={
          <>
            <i className="bi bi-person-circle me-1"></i>
            {user.role}
          </>
        } id="basic-nav-dropdown">
          <NavDropdown.Item onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i>
            Logout
          </NavDropdown.Item>
        </NavDropdown>
      </Nav>
    );
};

export { LandNav, AdminNav, StudentNav };
