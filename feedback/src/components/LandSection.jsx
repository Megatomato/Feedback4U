import Button from 'react-bootstrap/Button';

function LandSection(props) {
  return (
    <div>
      <div style={{
        width: '50%',
      }}>
        <h1> {props.name} </h1>
        <p> {props.txt} </p>
        <Button variant="primary">Let's Begin</Button>
      </div>
    </div>
  );
}

export default LandSection;
