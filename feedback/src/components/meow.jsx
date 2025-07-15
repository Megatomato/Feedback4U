import { useRef, useEffect } from 'react';
import ChromeDino from 'react-chrome-dino';

const SingleDino = ({ gameOver }) => {
  const containerRef = useRef(null);
  const dinoInstance = useRef(null);

  useEffect(() => {
    if (!dinoInstance.current && containerRef.current) {
      dinoInstance.current = ChromeDino({
        gameOver,
        parent: containerRef.current
      });
    }

    return () => {
      if (dinoInstance.current) {
        dinoInstance.current.destroy();
        dinoInstance.current = null;
      }
    };
  }, [gameOver]);

  return <div ref={containerRef} style={{ height: '150px' }} />;
};

export default SingleDino;
