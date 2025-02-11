import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSpot } from "../../store/spots";
import { useNavigate } from "react-router-dom";
import "./CreateSpotForm.css";

function CreateSpotForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.session.user); 

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    lat: "",
    lng: "",
    title: "", // Spot Name
    price: "",
    description: "",
    previewImage: "", //Preview Photo
    image1: "",
    image2: "",
    image3: "",
    image4: "",
  });

  const [errors, setErrors] = useState({});

  if (!user) {
    navigate("/login"); 
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
   
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    let newErrors = {};
    if (formData.description.length < 30) {
      newErrors.description = "Description must be at least 30 characters.";
    }
    if (!formData.previewImage) {
      newErrors.previewImage = "At least one image is required.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

  try {
    //  Create the new spot
    const newSpot = await dispatch(
      createSpot({
        name: formData.title, 
        description: formData.description,
        price: formData.price,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        previewImage: formData.previewImage, 
      })
    ).unwrap();

    //  Add the additional images
    await fetch(`/api/spots/${newSpot.newSpot.id}/images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [formData.image1, formData.image2, formData.image3, formData.image4].filter(Boolean),
      }),
    });

    navigate(`/spots/${newSpot.newSpot.id}`);
  } catch (error) {
    setErrors({ api: error.message });
  }
}

  return (
    <div className="create-spot-container">
      <h1>Create a New Spot</h1>
      <form onSubmit={handleSubmit}>
        <h3>Where&apos;s your place located?</h3>
        <p>Guests will only get your exact address once they booked a reservation.</p>
        <input type="text" name="address" placeholder="Street Address" onChange={handleChange} required />
        <input type="text" name="city" placeholder="City" onChange={handleChange} required />
        <input type="text" name="state" placeholder="State" onChange={handleChange} required />
        <input type="text" name="country" placeholder="Country" onChange={handleChange} required />
        <input type="number" name="lat" placeholder="Latitude (Optional)" onChange={handleChange} />
        <input type="number" name="lng" placeholder="Longitude (Optional)" onChange={handleChange} />

        <h3>Describe your place to guests</h3>
        <p>Mention the best features of your space, any special amenities like fast wifi or parking, and what you love about the neighborhood.</p>
        <textarea name="description" placeholder="Please write at least 30 characters" onChange={handleChange} required />
        {errors.description && <p className="error">{errors.description}</p>}

        <h3>Create a title for your spot</h3>
        <p>Catch guests&apos; attention with a spot title that highlights what makes your place special.</p>
        <input type="text" name="title" placeholder="Name of your spot" onChange={handleChange} required />

        <h3>Set a base price for your spot</h3>
        <p>Competitive pricing can help your listing stand out and rank higher in search results.</p>
        <input type="number" name="price" placeholder="$ Price per night (USD)" onChange={handleChange} required />

        <h3>Liven up your spot with photos</h3>
        <p>Submit a link to at least one photo to publish your spot.</p>
        <input type="url" name="previewImage" placeholder="Preview Image URL" onChange={handleChange} required />
        {errors.previewImage && <p className="error">{errors.previewImage}</p>}
        <input type="url" name="image1" placeholder="Image URL" onChange={handleChange} />
        <input type="url" name="image2" placeholder="Image URL" onChange={handleChange} />
        <input type="url" name="image3" placeholder="Image URL" onChange={handleChange} />
        <input type="url" name="image4" placeholder="Image URL" onChange={handleChange} />
        
        {errors.api && <p className="error">{errors.api}</p>}
        <button type="submit">Create Spot</button>
      </form>
    </div>
  );
}

export default CreateSpotForm;


