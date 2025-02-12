import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchSpotDetails } from "../../store/spots";
import "../SpotDetailsPage/SpotDetailsPage.css";

function SpotDetailsPage() {
  const { spotId } = useParams(); 
  const dispatch = useDispatch();
  const spot = useSelector((state) => state.spots.currentSpot);
  const user = useSelector((state) => state.session.user);

  useEffect(() => {
    dispatch(fetchSpotDetails(spotId)); 
  }, [dispatch, spotId]);

  if (!spot) return <h2>Loading spot details...</h2>;

  // Handle "Reserve" button click
  const handleReserve = () => {
    alert("Feature Coming Soon!");
  };

  return (
    <div className="spot-details-container">
      <h1 className="spot-title">{spot.name}</h1>
      <p className="spot-location">{spot.city}, {spot.state}, {spot.country}</p>
      
      <div className="spot-images">
        <img 
          src={spot.previewImage || spot.SpotImages?.[0]?.url} 
          alt={spot.name} 
          className="large-image" 
        />
        <div className="small-images">
          {spot.SpotImages?.slice(1, 5).map((image, index) => (
            <img key={index} src={image.url} alt={`Spot ${index}`} className="small-image" />
          ))}
        </div>
      </div>
      
      <p className="spot-host">Hosted by {spot.Owner.firstName} {spot.Owner.lastName}</p>
      
      <div className="spot-info-container2">
        <div className="spot-description">
          <p>{spot.description}</p>
        </div>
        <div className="spot-reserve-section">
  <div className="price-rating-container">
    <h3 className="price-box">${spot.price} <span>night</span></h3>
    <p className="spot-rating1">⭐ {spot.avgRating ? spot.avgRating.toFixed(1) : "New"} · {spot.numReviews} reviews</p>
  </div>
  <button onClick={handleReserve} className="reserve-button">Reserve</button>
</div>

      </div>

      <div className="spot-rating-container">
        <h3>⭐ {spot.avgRating ? spot.avgRating.toFixed(1) : "New"} · {spot.numReviews} reviews</h3>
      </div>

      <div className="reviews-section">
        <h3>Reviews</h3>
        {spot.Reviews?.length > 0 ? (
          [...spot.Reviews].reverse().map((review) => (
            <div key={review.id} className="review">
              <strong>{review.User.firstName}</strong> - {new Date(review.createdAt).toDateString()}
              <p>{review.review}</p>
            </div>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}
      </div>

      {user && !spot.Reviews?.some((review) => review.userId === user.id) && (
        <button className="post-review-button">Post Your Review</button>
      )}
    </div>
  );
}

export default SpotDetailsPage;