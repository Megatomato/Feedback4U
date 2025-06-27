import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import logo from '../assets/logo.png';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';

function LandSection(props) {
  return (
    <Container style={{
            paddingTop: "50px",
            paddingBottom: "50px",
        }}>
      <Row>
        <Col>
          <div style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <h1 style={{ fontSize: "3rem", margin: "0.67em 0" }}> {props.name} </h1>
            <p style={{ fontSize: "1.5rem", margin: "0.67em 0" }}> {props.txt} </p>
            <Button variant="primary">Let's Begin</Button>
          </div>
        </Col>
        <Col>
          <Image src={logo} rounded height="500px"/>
        </Col>
      </Row>
    </Container>
  );
}

function LandSectionRight(props) {
  return (
    <div style={{
            background: "#286983",
            color: "#faf4ed",
            paddingTop: "50px",
            paddingBottom: "50px",
    }}>
    <Container style={{
        marginTop: "50px",
        marginBottom: "50px",
    }}>
        <Row style={{
        marginTop: "50px",
        marginBottom: "50px",
        }}>
          <Col>
            <Image src={logo} rounded height="500px"/>
          </Col>
          <Col>
            <div style={{
              width: '60%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <h1 style={{ fontSize: "4rem", margin: "0.67em 0" }}> {props.name} </h1>
              <p style={{ fontSize: "1.5rem", margin: "0.67em 0" }}> {props.txt} </p>
              <Button variant="light">Let's Begin</Button>
            </div>
          </Col>
        </Row>
    </Container>
    </div>
  );
}

export { LandSection, LandSectionRight };
