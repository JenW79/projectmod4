import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUserSpots } from "../../store/spots"; 
import { useNavigate } from "react-router-dom";

import "../ManageSpotsPage/ManageSpots.css";

function ManageSpotsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleDelete = async (spotId) => {
    if (!window.confirm("Are you sure you want to delete this spot?")) return;
  
    const response = await fetch(`/api/spots/${spotId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
  
    if (response.ok) {
      dispatch(fetchCurrentUserSpots()); 
    } else {
      alert("Failed to delete spot.");
    }
  };
  
  return (
      <div className="manage-spots-container">
        <h1>Manage Your Spots</h1>
        <div className="spots-grid">
          {spots.map(spot => (
            <div key={spot.id} className="spot-card">
              <img src={spot.previewImage || "https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739144200/unnamed_mxhpr0.jpg"} alt={spot.name} className="spot-thumbnail" />
              <div className="spot-info">
                <h3>{spot.name}</h3>
                <p>{spot.city}, {spot.state}</p>
                <p>⭐ {spot.avgRating || "New"}</p>
                <p><strong>${spot.price}</strong> / night</p>
              </div>
              <div className="spot-buttons">
                <button className="update-btn" onClick={() => navigate(`/spots/${spot.id}/edit`)}>Update</button>
                <button className="delete-btn" onClick={() => handleDelete(spot.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default ManageSpotsPage;
