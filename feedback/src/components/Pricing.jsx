import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';

function PricingSection() {

    const firstFeature = ["1 Teacher", "4 Classes per Teacher", "Up to 10 Students per Class"];
    const seconFeature = ["Up to 100 Teachers", "Up to 4 Class per Teacher", "Up to 35 Students per Class"]
    const thirdFeature = ["Up to 250 Teachers", "Up to 6 Classes per Teacher", "Up to 250 per Class",
                          "API access / supoort for custom workflows, UI or integration with custom systems",
                          "Add ons avaliable for more teachers, classes and students"]
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
          <h1>Pricing</h1>
          <Row style={{
            marginTop: "50px",
            marginBottom: "50px",
            }}>
            <Col>
              <PricingCard name={"Home School Package"} desc={"Perfect for home schooling!"} price={"9.99"} features={firstFeature}/>
            </Col>
            <Col>
              <PricingCardAlt name={"Mid Sized School"} desc={"A great package for the average sized school"} price={"59.99"} features={seconFeature}/>
            </Col>
            <Col>
              <PricingCard name={"Large School / University"} desc={"Amazing for large schools or a starting point for universities"} price={"694.20"} features={thirdFeature}/>
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
        <Card.Title>{props.price}</Card.Title>
        <Card.Subtitle>{props.desc}</Card.Subtitle>
        <Card.Text>
          <StringList items={props.features}/>
        </Card.Text>
      <Button href="./signup">Begin Your Subscription</Button>
      </Card.Body>
    </Card>
  );
}

function PricingCardAlt(props) {
  return (
      <Card style={{
        width: '18rem',
        background: "#286983",
        color: "#faf4ed",
      }}>
      <Card.Body>
        <Card.Title>{props.name}</Card.Title>
        <Card.Title>{props.price}</Card.Title>
        <Card.Subtitle>{props.desc}</Card.Subtitle>
        <Card.Text>
          <StringList items={props.features}/>
        </Card.Text>
      <Button href="/signup" variant="light">Begin Your Subscription</Button>
      </Card.Body>
    </Card>
  );
}

function StringList({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default PricingSection
