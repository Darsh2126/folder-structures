import { NotFoundLayouts } from '@app/layouts';

const NotFoundRoutes = {
  path: '/',
  element: <NotFoundLayouts />,
  children: [
    {
      path: '', // notfound path
      element: <div>Not Found</div>,
    },
  ],
};

export default NotFoundRoutes;
