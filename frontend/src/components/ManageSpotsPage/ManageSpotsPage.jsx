import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUserSpots, deleteSpot } from "../../store/spots"; 
import { useNavigate } from "react-router-dom";
import "../ManageSpotsPage/ManageSpots.css";

function ManageSpotsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.session.user); 
  const spots = useSelector((state) => state.spots.userSpots);
  const status = useSelector((state) => state.spots.status);
  const error = useSelector((state) => state.spots.error);

  useEffect(() => {
    if (user) dispatch(fetchCurrentUserSpots());
    else navigate("/login"); // Redirect unauthorized users
  }, [dispatch, user, navigate]);

  if (status === "loading") return <h2>Loading spots...</h2>;
  if (status === "failed") return <h2>Error: {error}</h2>;
  
  if (!spots || spots.length === 0) {
    return (
      <div className="manage-spots-container">
        <h1>Manage Your Spots</h1>
        <button className="create-spot-btn" onClick={() => navigate("/spots/new")}>
          Create a New Spot
        </button>
        <h3>You have no spots listed yet.</h3>
      </div>
    );
  }

  const handleDelete = async (spotId) => {
    if (!window.confirm("Are you sure you want to delete this spot?")) return;
  
    try {
      await dispatch(deleteSpot(spotId)).unwrap();
      dispatch(fetchCurrentUserSpots()); // Refresh user's spots after deletion
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="manage-spots-container">
      <h1>Manage Your Spots</h1>
      <button className="create-spot-btn" onClick={() => navigate("/spots/new")}>
        Create a New Spot
      </button>
      <div className="spots-grid">
        {spots.map((spot) => (
          <div key={spot.id} className="spot-card">
            <img 
              src={spot.previewImage || "https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739144200/unnamed_mxhpr0.jpg"} 
              alt={spot.name} 
              className="spot-thumbnail" 
            />
            <div className="spot-info">
              <p>{spot.city}, {spot.state}</p>
              <p>⭐ {spot.avgRating || "New"} · {spot.numReviews} reviews</p>
              <p><strong>${spot.price}</strong> night</p>
            </div>
            <div className="spot-buttons">
        <button className="update-btn" onClick={() => navigate(`/spots/${spot.id}/edit`)}>
         Update
       </button>
        <button className="delete-btn" onClick={() => handleDelete(spot.id)}>
        Delete
       </button>
</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageSpotsPage;




