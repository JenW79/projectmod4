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
    name: "",
    price: "",
    description: "",
    lat: "0",
    lng: "0", 
    imageUrl: ""
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
    if (!formData.imageUrl) {
      newErrors.imageUrl = "At least one image is required.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const newSpot = await dispatch(createSpot(formData)).unwrap();
      navigate(`/spots/${newSpot.id}`);
    } catch (error) {
      setErrors({ api: error });
    }
  };
  
  return (
    <div className="create-spot-container">
      <h1>Create a New Spot</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="address" placeholder="Address" onChange={handleChange} required />
        <input type="text" name="city" placeholder="City" onChange={handleChange} required />
        <input type="text" name="state" placeholder="State" onChange={handleChange} required />
        <input type="text" name="country" placeholder="Country" onChange={handleChange} required />
        <input type="text" name="name" placeholder="Spot Name" onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price per night" onChange={handleChange} required />
        <textarea name="description" placeholder="Description (min. 30 characters)" onChange={handleChange} required />
        {errors.description && <p className="error">{errors.description}</p>}
        <input type="url" name="imageUrl" placeholder="Image URL" onChange={handleChange} required />
        {errors.imageUrl && <p className="error">{errors.imageUrl}</p>}
        {errors.api && <p className="error">{errors.api}</p>}
        <button type="submit">Create Spot</button>
      </form>
    </div>
  );
}

export default CreateSpotForm;

