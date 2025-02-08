import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllSpots = createAsyncThunk(
  "spots/fetchAllSpots",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/spots");
      if (!response.ok) {
        throw new Error("Failed to fetch spots");
      }
      const data = await response.json();
      console.log("🔥 All Spots:", data);
      return data.spots; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

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

//  Async Thunk to fetch current user's spots
export const fetchCurrentUserSpots = createAsyncThunk(
  "spots/fetchCurrentUserSpots",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/spots/current"); //  Backend route
      if (!response.ok) {
        throw new Error("Failed to fetch spots");
      }
      return await response.json();
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
        console.log("🔥 Redux action payload:", action.payload);
        if (action.payload && action.payload.spots) {
          state.userSpots = [...action.payload.spots];
          console.log("🔥 Redux userSpots after update:", state.userSpots);
        } else {
          console.log("🚨 No spots found in payload!");
          state.userSpots = [];
        }
        state.status = "succeeded";
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
    state.currentSpot = action.payload; // ✅ Store fetched spot details
    })
  },
});
export default spotsSlice.reducer;