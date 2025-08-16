import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedDate: '',
  events: {},
  location : '',
  temperature: '',
};

const plannerSlice = createSlice({
  name: 'planner',
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    addEvent: (state, action) => {
      const { date, event } = action.payload;
      if (!state.events[date]) {
        state.events[date] = [];
      }
      state.events[date].push(event);
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setTemperature: (state, action) => {
      state.temperature = action.payload;
    },
  },
});

export const { setSelectedDate, setEvents, addEvent , setLocation, setTemperature} = plannerSlice.actions;

export default plannerSlice.reducer;
