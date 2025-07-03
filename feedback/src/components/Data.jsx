import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

/*
 * Meow
 *
 * props should have .data and .headers?
 * seems right?
*/

function ATable(props) {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          {props.headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
          {props.data.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>
                <Button>Change Assigned Teacher</Button>
                <span className="mx-2">-</span>
                {row.first}
              </td>
              <td>
                <Button>Edit Students</Button>
              </td>
              <td>
                <Button>View Analytics</Button>
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  );
}

export { ATable };
