import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import './css/App.css';

const ViewWishes = () => {
  const { jarId, viewId } = useParams();
  const [wishes, setWishes] = useState([]);
  const [jarData, setJarData] = useState(null);

  useEffect(() => {
    const jarRef = ref(db, `jars/${jarId}`);
    onValue(jarRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.viewId === viewId) {
          setJarData(data);
          setWishes(Object.values(data.wishes || {}));
        }
      }
    });
  }, [jarId, viewId]);

  if (!jarData) return <div>Invalid jar or view ID</div>;

  return (
    <div className="view-wishes">
       <h2 style={{ fontSize: "34px", textAlign: "center", marginBottom: "30px"}}>Wishes for {jarData.name}'s Jar</h2>
      <div className="wishes-list">
        {wishes.map((wish, index) => (
          <div key={index} className="wish-item">
            {wish.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewWishes;