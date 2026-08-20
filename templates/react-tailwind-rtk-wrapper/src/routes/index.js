import { useRoutes } from 'react-router-dom';
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';
import NotFoundRoutes from './NotFoundRoutes';

export const Router = () => {
  return useRoutes([MainRoutes(), LoginRoutes, NotFoundRoutes]);
};
