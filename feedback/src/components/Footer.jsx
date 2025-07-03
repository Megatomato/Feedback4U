import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

function FeetDroolEmoji() {
  return (
    <footer className="fixed-bottom" style={{
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
                <Button href="/careers"> Careers </Button>
            </Row>
            <Row>
                <Button href="/contact"> Contact us </Button>
            </Row>
        </Col>

        <Col>
            <Row>
                <h3> Meow </h3>
            </Row>
            <Row>
                <Button href="/cat"> Meow </Button>
            </Row>
            <Row>
                <Button href="/cat"> Meow </Button>
            </Row>
        </Col>

        <Col>
            <Row>
                <h3> Meow </h3>
            </Row>
            <Row>
                <Button href="/cat"> Meow </Button>
            </Row>
        </Col>

        </Row>
      </Container>
    </footer>
  );
}

export default FeetDroolEmoji;
