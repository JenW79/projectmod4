import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchSpotDetails } from "../../store/spots";
import PostReviewModal from "../PostReviewModal/PostReviewModal";
import DeleteReviewModal from "../DeleteReviewModal/DeleteReviewModal";
import "../SpotDetailsPage/SpotDetailsPage.css";
import { calculateRating } from "../../utils/calculatingRating";

function SpotDetailsPage() {
  const { spotId } = useParams();
  const dispatch = useDispatch();
  const spot = useSelector((state) => state.spots.currentSpot);
  const user = useSelector((state) => state.session.user);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  useEffect(() => {
    dispatch(fetchSpotDetails(spotId));
  }, [dispatch, spotId]);

  if (!spot) return <h2>Loading spot details...</h2>;

  //  Clone array before reversing to prevent errors
  const reviewsArray = [...(spot.Reviews?.Reviews || [])].reverse();
  const { avgRating, numReviews } = calculateRating(reviewsArray);

  // const totalStars = reviewsArray.reduce((acc, review) => acc + review.stars, 0);
  // const avgRating = reviewsArray.length ? (totalStars / reviewsArray.length).toFixed(1) : "New";

  const hasReviewed = reviewsArray.some(review => review.userId === user?.id);
  const isOwner = user?.id === spot.Owner?.id;

  return (
    <div className="spot-details-container">
      {/* Spot Name & Location */}
      <h1 className="spot-title">{spot.name}</h1>
      <p className="spot-location">{spot.city}, {spot.state}, {spot.country}</p>

     {/* Spot Images Grid (1 Large + 4 Small) */}
<div className="spot-images-container">
         {/* Main Image (Preview Image) */}
<img 
  src={spot.previewImage || (spot.SpotImages?.length > 0 ? spot.SpotImages[0].url : "https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739144200/unnamed_mxhpr0.jpg")} 
  alt="Main Spot" 
  className="main-image" 
/>
 {/* Grid for Additional Images */}
<div className="grid-images">
  {spot.SpotImages?.slice(1, 5).map((image, index) => (
    <img 
      key={image.id || `placeholder-${index}`} 
      src={image.url || "https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739144200/unnamed_mxhpr0.jpg"} 
      alt={`Spot ${index + 1}`} 
      className="grid-image" 
    />
  ))}

  {/* Fill empty slots with placeholders if less than 4 images */}
  {Array.from({ length: Math.max(0, 4 - (spot.SpotImages?.length - 1)) }).map((_, index) => (
    <img 
      key={`placeholder-${index}`} 
      src="https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739144200/unnamed_mxhpr0.jpg"
      alt="Placeholder" 
      className="grid-image placeholder-image"
    />
  ))}
</div>
</div>



      {/* Host Info */}
      <p className="spot-host">Hosted by {spot.Owner?.firstName} {spot.Owner?.lastName}</p>

      {/* Spot Details (Price, Rating, Reserve Button) */}
      <div className="spot-info-container">
        <div className="spot-description">
          <p>{spot.description}</p>
        </div>
        <div className="spot-reserve-section">
        <div className="price-rating-container">
         <h3 className="price-box">${spot.price} <span>night</span></h3>
         <p className="spot-rating3">
          <i className="fa-solid fa-star"></i> {avgRating} · {numReviews} reviews
           </p>
        </div>
          <button className="reserve-button" onClick={() => alert("Feature Coming Soon!")}>Reserve</button>
        </div>
        
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
      <p className="spot-rating2">
          <i className="fa-solid fa-star"></i> {avgRating} · {numReviews} reviews
           </p>
      {user && !isOwner && !hasReviewed && (
          <button className="post-review-btn" onClick={() => setShowReviewModal(true)}>Post Your Review</button>
        )}
        
        {reviewsArray.length > 0 ? (
          reviewsArray.map(review => (
            <div key={review.id} className="review">
              <strong>{review.User?.username || "Anonymous"}</strong>
              <p>{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <p>{review.review}</p>
              {user?.id === review.userId && (
                <button className="delete-review-btn" onClick={() => {
                  setSelectedReviewId(review.id);
                  setShowDeleteModal(true);
                }}>Delete</button>
              )}
            </div>
          ))
        ) : (
          user && !isOwner && !hasReviewed && (
            <p>Be the first to post a review!</p>
          )
        )}
      </div>

      {showReviewModal && <PostReviewModal spotId={spotId} onClose={() => setShowReviewModal(false)} />}
      {showDeleteModal && <DeleteReviewModal reviewId={selectedReviewId} spotId={spotId} onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}

export default SpotDetailsPage;
