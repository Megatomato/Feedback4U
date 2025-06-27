import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import logo from '../assets/logo.png';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';

function PricingSection() {
    return (
      <Container style={{
              paddingTop: "50px",
              paddingBottom: "50px",
      }}>
        <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
        }}>
          <Row>
            <Col>
              <PricingCard name={"Home School Package"} price={"9.99"}/>
            </Col>
            <Col>
              <PricingCard name={"Mid Sized School"} price={"59.99"}/>
            </Col>
            <Col>
              <PricingCard name={"Large School / University"} price={"694.20"}/>
            </Col>
          </Row>
        </div>
      </Container>
    );
}

function PricingCard(props) {
  return (
      <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title>{props.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{props.price}</Card.Subtitle>
        <Card.Text>
          Features
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default PricingSection
