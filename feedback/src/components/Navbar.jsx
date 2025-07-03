import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import logo from '../assets/logo.png';
import Image from 'react-bootstrap/Image';


function LandNav() {
  return (
    <>
      <Navbar bg="primary" data-bs-theme="dark">
        <Container>
          <Image src={logo} rounded height="35px"/>
          <Navbar.Brand href="/">Feedback4U</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link href="#pricing">Pricing</Nav.Link>
            <Nav.Link href="/signup">Login</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

function AdminNav() {
  return (
    <>
      <Navbar bg="primary" data-bs-theme="dark">
        <Container>
          <Image src={logo} rounded height="35px"/>
          <Navbar.Brand href="/admin/dashboard">Feedback4U</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link href="/admin/students">Students</Nav.Link>
            <Nav.Link href="/admin/teachers">Teachers</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}


export { LandNav, AdminNav };
