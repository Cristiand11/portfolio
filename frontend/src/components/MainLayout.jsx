import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="relative flex h-screen bg-gray-100">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuButtonClick={toggleMobileMenu} title={pageTitle} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>

      {isMobileMenuOpen && (
        <div
          onClick={toggleMobileMenu}
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
        ></div>
      )}
    </div>
  );
}
