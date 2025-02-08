import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUserSpots } from "../../store/spots"; 

function ManageSpotsPage() {
  const dispatch = useDispatch();
  const spots = useSelector((state) => state.spots.userSpots);
  const status = useSelector((state) => state.spots.status);
  const error = useSelector((state) => state.spots.error);

  useEffect(() => {
    dispatch(fetchCurrentUserSpots());
  }, [dispatch]);

  console.log(" Spots in component:", spots);

  if (status === "loading") return <h2>Loading spots...</h2>;
  if (status === "failed") return <h2>Error: {error}</h2>;
  if (!spots || spots.length === 0) return <h2>You have no spots listed yet.</h2>;

  return (
    <div>
      <h1>Manage Your Spots</h1>
      <ul>
        {spots.map((spot) => (
          <li key={spot.id}>{spot.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default ManageSpotsPage;
