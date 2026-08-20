// This is App Wrapper for almost same Sidebar, Header etc.

import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <main>
      <nav>Navbar</nav>
      <aside>sidebar</aside>
      <section>
        <Outlet />
      </section>
    </main>
  );
};

export default AppLayout;
