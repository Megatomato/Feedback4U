import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate } from 'react-router-dom';

function ATable(props) {
  const navigate = useNavigate();

  // Safety check for data
  if (!props.data || !Array.isArray(props.data)) {
    return (
      <div>
        <h1> Edit / View Courses </h1>
        <p>No courses available or loading...</p>
      </div>
    );
  }

  return (
    <div>
    <h1> Edit / View Courses </h1>
    <Table striped hover bordered style={{ "--bs-table-striped-bg": "#dfdad9" }}>
      <tbody>
        {props.data.map((row) => (
          <tr
            key={row.course_name}
            onClick={() => navigate(`/course/${row.course_id}`)}
            style={{ cursor: 'pointer' }}
          >
            <td className="col-2">{row.course_name}</td>
            <td className="col-6">
              <Col>
                <Row className="justify-content-center">
                  <strong>{row.course_description}</strong>
                </Row>
                <Row className="text-center">
                  <small className="text-muted">
                    Teacher: {row.teacher_name || 'Unknown'} ({row.teacher_email || 'No email'})
                  </small>
                </Row>
                <Row>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Change teacher clicked for course:", row.course_id)
                    }}
                  >
                    Change Assigned Teacher
                  </Button>
                </Row>
              </Col>
            </td>
            <td
              className="text-center align-middle col-3"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: "0.5rem" }}  // Optional: Adjust padding if needed
            >
              <Button
                variant="outline-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Edit students clicked for course:", row.course_id);
                }}
                className="mx-auto"  // Centers button horizontally
                style={{ display: "block" }}  // Makes mx-auto work
              >
                Edit Students
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    </div>
  );
}
export { ATable };
