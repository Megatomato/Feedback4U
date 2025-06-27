import Container from 'react-bootstrap/Container';
import logo from '../assets/logo.png';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function FeetDroolEmoji() {
  return (
    <div style={{
       background: "#286983",
       color: "#faf4ed",
    }}>
      <Container style={{
                paddingTop: "50px",
                paddingBottom: "50px",
      }}>
        <Row>

        <Col>
            <Row>
                <h3> Community </h3>
            </Row>
            <Row>
                <p> Careers </p>
            </Row>
            <Row>
                <p> Contact us </p>
            </Row>
        </Col>

        <Col>
            <Row>
                <h3> Meow </h3>
            </Row>
            <Row>
                <p> Meow </p>
            </Row>
            <Row>
                <p> Meow </p>
            </Row>
        </Col>

        <Col>
            <Row>
                <h3> Meow </h3>
            </Row>
            <Row>
                <p> Meow </p>
            </Row>
        </Col>

        </Row>
      </Container>
    </div>
  );
}

export default FeetDroolEmoji;
