import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import financialReducer, { STORAGE_KEY } from './financialSlice';

export const store = configureStore({
  reducer: {
    financial: financialReducer,
  },
});

// Auto-save state to localStorage on every state update
store.subscribe(() => {
  try {
    const state = store.getState().financial;
    if (state.autoSaveEnabled) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('Auto-save to localStorage failed:', e);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
