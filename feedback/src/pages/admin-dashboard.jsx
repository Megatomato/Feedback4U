import React from "react";
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Container from "react-bootstrap/Container"
import Card from "react-bootstrap/Card"
import Button from "react-bootstrap/Button"

import { AdminNav }  from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { ATable, Chart } from '../components/Data.jsx';

const AdminDashPage = () => {

    const data = [
      { id: "CSSE6400", first: 'Richard Thomas'},
      { id: "COMP3506", first: 'Richard Thomas'},
      { id: "COMP3400", first: 'Paul Vbrik'},
      { id: "CSSE3200", first: 'Guowei Yang'},
      { id: "CSSE3100", first: 'Guowei Yang'},
      { id: "COMS3200", first: 'Dan Kim'},
      { id: "CSSE1001", first: 'Jane Smith'},
      { id: "CSSE3200", first: 'Bob Johnson'},
    ];

    return (
    <div>
        <AdminNav/>
        <Container style={{
            paddingBottom: "50px",
        }}>
          <Row style={{
            paddingTop: "50px",
            paddingBottom: "50px",
          }}>
            <Col>
              <QuarterScreenCard title={"Edit Students"} txt={"Add / Remove or change information about students"}/>
            </Col>
            <Col>
              <QuarterScreenCard title={"Edit Teachers"} txt={"Add / Remove or change information about teachers"}/>
            </Col>
          </Row>
          <div style={{
            maxHeight: "450px",
            overflowY: "auto"
          }}>
            <ATable
              headers={["Course Code", "Teacher", "Students", "Analytics" ]}
              data={data}
            />
          </div>
        </Container>
        <Footer/>
    </div>
    );
};

function QuarterScreenCard(props) {
  return (
    <Container fluid>
          <Card style={{
                height: '15vh',
          }}>
            <Card.Body>
              <Card.Title>
                <Button>{props.title}</Button>
              </Card.Title>
              <Card.Text>{props.txt}</Card.Text>
            </Card.Body>
          </Card>
    </Container>
  );
}

export default AdminDashPage;
