import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  watchList: {},
};

export const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setWatchList: (state, action) => {
      const { symbol } = action.payload;
      state.watchList = {
        ...state.watchList,
        [`${symbol}`]: action.payload
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { setWatchList } = stockSlice.actions;

export default stockSlice.reducer;
