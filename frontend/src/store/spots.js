import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Fetch all spots
export const fetchAllSpots = createAsyncThunk(
  "spots/fetchAllSpots",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/spots");
      if (!response.ok) {
        throw new Error("Failed to fetch spots");
      }
      const data = await response.json();
      return data.spots;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete a spot
export const deleteSpot = createAsyncThunk(
  "spots/deleteSpot",
  async (spotId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/spots/${spotId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to delete spot");
      }

      return spotId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch spot details
export const fetchSpotDetails = createAsyncThunk(
  "spots/fetchSpotDetails",
  async (spotId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/spots/${spotId}`);
      if (!response.ok) throw new Error("Failed to fetch spot details");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch current user's spots
export const fetchCurrentUserSpots = createAsyncThunk(
  "spots/fetchCurrentUserSpots",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/spots/current");
      if (!response.ok) {
        throw new Error("Failed to fetch spots");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSpot = createAsyncThunk(
  "spots/createSpot",
  async (spotData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spotData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create spot");
      }

      return data; // Return the new spot object
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Spot Slice
const spotsSlice = createSlice({
  name: "spots",
  initialState: {
    userSpots: [],
    allSpots: [],
    currentSpot: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUserSpots.fulfilled, (state, action) => {
        if (action.payload && action.payload.spots) {
          state.userSpots = action.payload.spots;
        } else {
          state.userSpots = [];
        }
        state.status = "succeeded";
      })
      .addCase(fetchCurrentUserSpots.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteSpot.fulfilled, (state, action) => {
        state.userSpots = state.userSpots.filter((spot) => spot.id !== action.payload);
      })
      .addCase(deleteSpot.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchAllSpots.fulfilled, (state, action) => {
        state.allSpots = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchAllSpots.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSpotDetails.fulfilled, (state, action) => {
        state.currentSpot = action.payload;
      })
      .addCase(fetchSpotDetails.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createSpot.fulfilled, (state, action) => {
        state.userSpots.push(action.payload);
        state.status = "succeeded";
      })
      .addCase(createSpot.rejected, (state, action) => {
        state.error = action.payload;
      })
  },
});

export default spotsSlice.reducer;

