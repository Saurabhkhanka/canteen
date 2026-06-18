import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected) => useSelector(selector);
export const useAppStore = () => useStore<AppStore>();
export const useTypedSelector: <TSelected>(selector: (state: RootState) => TSelected) => TSelected = useSelector;
