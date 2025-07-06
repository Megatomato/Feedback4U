import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useNavigate } from 'react-router-dom';

function ATable(props) {
  const navigate = useNavigate();

  return (
    <Table striped bordered hover>
      <tbody>
        {props.data.map((row) => (
          <tr
            key={row.id}
            onClick={() => navigate('/courses')}
            style={{ cursor: 'pointer' }}
          >
            <td>{row.id}</td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Change teacher clicked")
                }}
              >
                Change Assigned Teacher
              </Button>
              <span className="mx-2">-</span>
              {row.first}
            </td>
            <td onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Change teacher clicked")
                }}
              >
                Edit Students
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
export { ATable };
