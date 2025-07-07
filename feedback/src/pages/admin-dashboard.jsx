import React, { useState }from "react";
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Container from "react-bootstrap/Container"
import Card from "react-bootstrap/Card"
import Button from "react-bootstrap/Button"
import ButtonToolbar from "react-bootstrap/ButtonToolbar"
import Modal from "react-bootstrap/Modal"

import { AdminNav }  from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { ATable } from '../components/Data.jsx';
import { AddTeacherForm, AddStudentForm } from '../components/Forms.jsx';

const AdminDashPage = () => {

    const data = {
      name: "UQ",
      courses: [
        // code and id should swap
        { code: "1", id: "CSSE6400", first: 'Richard Thomas'},
        { id: "COMP3506", first: 'Richard Thomas'},
        { id: "COMP3400", first: 'Paul Vbrik'},
        { id: "COMP3400", first: 'Paul Vbrik'},
        { id: "CSSE3200", first: 'Guowei Yang'},
        { id: "CSSE3100", first: 'Guowei Yang'},
        { id: "CSSE3100", first: 'Guowei Yang'},
        { id: "COMS3200", first: 'Dan Kim'},
        { id: "CSSE1001", first: 'Jane Smith'},
        { id: "CSSE3200", first: 'Bob Johnson'},
        { id: "COMS3200", first: 'Dan Kim'},
        { id: "CSSE1001", first: 'Jane Smith'},
        { id: "CSSE3200", first: 'Bob Johnson'},
        { id: "CSSE3200", first: 'Guowei Yang'},
        { id: "CSSE3100", first: 'Guowei Yang'},
        { id: "CSSE3100", first: 'Guowei Yang'},
        { id: "COMS3200", first: 'Dan Kim'},
        { id: "CSSE1001", first: 'Jane Smith'},
        { id: "CSSE3200", first: 'Bob Johnson'},
        { id: "COMS3200", first: 'Dan Kim'},
        { id: "CSSE1001", first: 'Jane Smith'},
        { id: "CSSE3200", first: 'Bob Johnson'},
      ],
    };

    return (
    <div>
        <AdminNav/>
        <Container style={{
            paddingBottom: "50px",
        }}>
        <Row>
          <Col>
            <Row>
              <h1> {data.name} Overview </h1>
              <h4> Total Courses - 123 </h4>
              <h4> Total Teachers - 123 </h4>
              <h4> Total Students - 123 </h4>
              <h4> Average Submissions per Student - 2.3 </h4>
            </Row>
          </Col>
          <Col>
            <Row style={{
              paddingBottom: "50px",
            }}>
              <Col>
                <AddXButton form={<AddStudentForm/>} title={"Student"} txt={"Add / Remove or change information about students"}/>
              </Col>
              <Col>
                <AddXButton form={<AddTeacherForm/>} title={"Teacher"} txt={"Add / Remove or change information about teachers"}/>
              </Col>
            </Row>
            <div style={{
              maxHeight: "650px",
              overflowY: "auto"
            }}>
              <ATable
                headers={["Course Code", "Teacher", "Students"]}
                data={data.courses}
              />
            </div>
          </Col>
        </Row>
        </Container>
    </div>
    );
};

function AddXButton(props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleCloseAdd = () => setShowAddModal(false);
  const handleShowAdd = () => setShowAddModal(true);

  const handleCloseEdit = () => setShowEditModal(false);
  const handleShowEdit = () => setShowEditModal(true);

  return (
    <Container className="text-center align-middle mx-auto" fluid>
      <Card>
        <Card.Body>
          <Card.Title>
            {props.txt}
          </Card.Title>
          <Card.Text>
            <ButtonToolbar>
              <Button onClick={handleShowAdd} className="mx-auto">
                Add {props.title}s
              </Button>
              <Button variant="outline-primary" onClick={handleShowEdit} className="mt-2 mx-auto">
                Edit {props.title} Information
              </Button>
            </ButtonToolbar>
          </Card.Text>
        </Card.Body>
      </Card>

      <Modal show={showAddModal} onHide={handleCloseAdd}>
        <Modal.Header closeButton>
          <Modal.Title>Add {props.title}s</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {props.form}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAdd}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit {props.title} Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {props.form}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminDashPage;
