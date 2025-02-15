import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchSpotDetails } from "../../store/spots";
import PostReviewModal from "../PostReviewModal/PostReviewModal"; 
import DeleteReviewModal from "../DeleteReviewModal/DeleteReviewModal"; 
import "./SpotDetailsPage.css";

function SpotDetailsPage() {
  const { spotId } = useParams();
  const dispatch = useDispatch();
  const spot = useSelector((state) => state.spots.currentSpot);
  console.log("Current Spot from Redux:", spot);
  const user = useSelector((state) => state.session.user);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  useEffect(() => {
    dispatch(fetchSpotDetails(spotId))
      .then((result) => console.log("Spot Details Response:", result.payload)); 
  }, [dispatch, spotId]);

  if (!spot) return <h2>Loading spot details...</h2>;

  const hasReviewed = Array.isArray(spot.Reviews) && spot.Reviews.some(review => review.userId === user?.id);

  const isOwner = user?.id === spot.Owner?.id;

  const reviewsArray = spot.Reviews?.Reviews || []; 

  const totalStars = reviewsArray.reduce((acc, review) => acc + review.stars, 0);
  const avgRating = reviewsArray.length ? (totalStars / reviewsArray.length).toFixed(1) : "New";
  


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

      <p className="spot-host">
        {spot.Owner
          ? `Hosted by ${spot.Owner.firstName} ${spot.Owner.lastName}`
          : "Loading host info..."}
      </p>

      <div className="spot-info-container2">
        <div className="spot-description">
          <p>{spot.description}</p>
        </div>
        <div className="spot-reserve-section">
          <div className="price-rating-container">
            <h3 className="price-box">${spot.price} <span>night</span></h3>
            <p className="spot-rating1">⭐ {avgRating} · {spot.Reviews?.length || 0} reviews</p>


          </div>
          <button className="reserve-button">Reserve</button>
        </div>
      </div>

      <div className="spot-rating-container">
      <p className="spot-rating1">⭐ {avgRating} · {spot.Reviews?.length || 0} reviews</p>

      </div>

      <div className="reviews-section">
        <h3>Reviews</h3>

        
        {user && !isOwner && !hasReviewed && (
          <button className="post-review-btn" onClick={() => setShowReviewModal(true)}>
            Post Your Review
          </button>
        )}

{reviewsArray.length > 0 ? (
  [...reviewsArray].reverse().map((review) => (
    <div key={review.id} className="review">
      <strong>{review.User?.firstName || "Anonymous"}</strong>
      - {new Date(review.createdAt).toDateString()}
      <p>{review.review}</p>

      {user?.id === review.userId && (
        <button
          className="delete-review-btn"
          onClick={() => {
            setSelectedReviewId(review.id);
            setShowDeleteModal(true);
          }}
        >
          Delete
        </button>
      )}
    </div>
  ))
) : (
  <p>No reviews yet.</p>
)}
      </div>
      
      {showReviewModal && <PostReviewModal spotId={spotId} onClose={() => setShowReviewModal(false)} />}
      {showDeleteModal && (<DeleteReviewModal reviewId={selectedReviewId} spotId={spotId} onClose={() => setShowDeleteModal(false)} />)}
    </div>
  );
}

export default SpotDetailsPage;
