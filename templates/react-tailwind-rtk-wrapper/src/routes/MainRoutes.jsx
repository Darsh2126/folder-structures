import { Auth } from '@app/hoc';
import { AppLayout } from '@app/layouts';

const ModuleRoutes = () => [
  {
    path: '',
    component: <div />, // Will call component like this Dash in place of <Dash />
    hoc: Auth, // HOC for protected routes
  },
];

const MainRoutes = () => {
  const Route = ModuleRoutes().map((route) => {
    const WrappedComponent = route.hoc(route.component);
    return { path: route.path, element: <WrappedComponent /> };
  });
  return {
    path: '/',
    element: <AppLayout />,
    children: [...Route],
  };
};

export default MainRoutes;
