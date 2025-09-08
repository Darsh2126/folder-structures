import { AuthLayout } from '@app/layouts';

const LoginRoutes = {
  path: '/',
  element: <AuthLayout />,
  children: [{ path: '', element: <div /> }],
};

export default LoginRoutes;

// Note: This Route only for Login based coponents
