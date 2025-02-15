import { createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

export const createReview = createAsyncThunk(
  "reviews/createReview",
  async ({ spotId, review, stars }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/spots/${spotId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "XSRF-Token": Cookies.get("XSRF-TOKEN"),
        },
        body: JSON.stringify({ review, stars }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create review");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
