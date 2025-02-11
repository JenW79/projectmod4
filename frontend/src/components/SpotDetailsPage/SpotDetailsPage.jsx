import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchSpotDetails } from "../../store/spots";
import "./SpotDetailsPage.css";

function SpotDetailsPage() {
  const { spotId } = useParams(); 
  const dispatch = useDispatch();
  const spot = useSelector((state) => state.spots.currentSpot);
  const user = useSelector((state) => state.session.user);

  useEffect(() => {
    dispatch(fetchSpotDetails(spotId)); 
  }, [dispatch, spotId]);

  if (!spot) return <h2>Loading spot details...</h2>;

  //  Handle "Reserve" button click
  const handleReserve = () => {
    alert("Feature Coming Soon!");
  };

  return (
    <div className="spot-details-container">
  <h1 className="spot-title">{spot.name}</h1>
  <h3 className="spot-location">{spot.city}, {spot.state}</h3>
  <p className="spot-host">Hosted by {spot.Owner.firstName} {spot.Owner.lastName}</p>

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

  
  <div className="spot-reserve-section">
        <div className="price-box">
          <h2>${spot.price} <span>/ night</span></h2>
        </div>
        <button onClick={handleReserve} className="reserve-button">Reserve</button>
      </div>

      <div className="spot-rating">
        <h2>⭐ {spot.avgRating ? spot.avgRating.toFixed(1) : "New"} ({spot.numReviews} reviews)</h2>
      </div>

      <div className="reviews-section">
        <h2>Reviews</h2>
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
