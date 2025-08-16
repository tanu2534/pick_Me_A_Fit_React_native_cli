import { configureStore } from '@reduxjs/toolkit';
import plannerReducer from './planner';

export const store = configureStore({
  reducer: {
    planner: plannerReducer,
  },
});


