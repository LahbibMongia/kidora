import asset_assets_img_logo_png from "assets/img/logo.png";
/*eslint-disable*/
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "context/AuthContext.jsx";

// components
import IndexDropdown from "components/Dropdowns/IndexDropdown.jsx";

export default function Navbar(props) {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const { isAuthenticated, logout, role } = useAuth();

  const getProfileLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "babysitter") return "/profile-bs";
    return "/profile";
  };

  return (
    <>
      <nav className="top-0 fixed z-50 w-full flex flex-wrap items-center justify-between px-2 py-3 navbar-expand-lg border-b border-solid" style={{ backgroundColor: "#edf5f3", borderColor: "#f09949" }}>
        <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
          <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
            <Link
              className="text-black text-sm font-bold leading-relaxed flex items-center mr-4 py-2 whitespace-nowrap uppercase"
              to="/"
            >
              {/* Logo first (Left) */}
              <img
                alt="KidOra Logo"
                src={asset_assets_img_logo_png}
                className="w-10 h-10 mr-2 object-contain"
              />
              <div 
                className="text-2xl font-bold mt-1 tracking-tight" 
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                <span style={{ color: "#2D4F4F" }}>Kid</span> 
                <span style={{ color: "#EC774F" }}>Ora</span>
              </div>
            </Link>
            
            <button
              className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <i className="text-white fas fa-bars"></i>
            </button>
          </div>
          <div
            className={
              "lg:flex flex-grow items-center bg-white lg:bg-opacity-0 lg:shadow-none" +
              (navbarOpen ? " block" : " hidden")
            }
            id="example-navbar-warning"
          >
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
              <li className="flex items-center">
                <IndexDropdown />
              </li>
              <li className="flex items-center">
                <a
                  className="hover:text-blueGray-500 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdemos.creative-tim.com%2Fnotus-react%2F%23%2F"
                  target="_blank"
                >
                  <i className="text-blueGray-400 fab fa-facebook text-lg leading-lg " />
                  <span className="lg:hidden inline-block ml-2">Share</span>
                </a>
              </li>

              <li className="flex items-center">
                <a
                  className="hover:text-blueGray-500 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fdemos.creative-tim.com%2Fnotus-react%2F%23%2F&text=Start%20your%20development%20with%20a%20Free%20Tailwind%20CSS%20and%20React%20UI%20Kit%20and%20Admin.%20Let%20Notus%20React%20amaze%20you%20with%20its%20cool%20features%20and%20build%20tools%20and%20get%20your%20project%20to%20a%20whole%20new%20level.%20"
                  target="_blank"
                >
                  <i className="text-blueGray-400 fab fa-twitter text-lg leading-lg " />
                  <span className="lg:hidden inline-block ml-2">Tweet</span>
                </a>
              </li>

              {isAuthenticated ? (
                <>
                  <li className="flex items-center">
                    <Link
                      to={getProfileLink()}
                      className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150"
                    >
                      Profile
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = "/";
                      }}
                      className="bg-red-500 text-white active:bg-red-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <Link
                      to="/auth/register"
                      className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150"
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <Link
                      to="/auth/login"
                      className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150"
                    >
                      Login 
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
