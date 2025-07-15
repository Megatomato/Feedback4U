import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
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
    <Card style={{
      maxHeight: "750px",
      overflowY: "auto",
      padding: "10px"
    }}>
      <h1 className="text-center"> Edit / View Courses </h1>
      <Table striped hover bordered style={{ "--bs-table-striped-bg": "#dfdad9" }}>
        <tbody>
          {props.data.map((row) => (
            <tr
              key={row.course_name}
              onClick={() => navigate(`/course/${row.course_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <td className="align-middle">
                <Col><Row>
                  <div className="d-flex justify-content-center align-items-center">
                    {row.course_name}
                    </div></Row><Row>
                  <div className="d-flex justify-content-center align-items-center">
                    <strong>{row.course_description}</strong>
                  </div>
                </Row></Col>
              </td>
              <td className="text-center">
                Teacher: {row.teacher_name || 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
export { ATable };
