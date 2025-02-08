import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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
  }
});

export default spotsSlice.reducer;