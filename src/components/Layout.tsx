import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const Layout = () => {
  return (
    <>
      {/* Main content area */}
      <div className="min-h-screen pb-20">
        <Outlet />
      </div>

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </>
  );
};

export default Layout;
