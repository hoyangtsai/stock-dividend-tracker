import { configureStore } from '@reduxjs/toolkit';
import stockReducer from '@/features/stock/stockSlice';

export const store = configureStore({
  reducer: {
    stock: stockReducer,
  },
});
