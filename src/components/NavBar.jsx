import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="max-w-7xl mx-auto px-6 flex justify-start items-center gap-x-10 h-14">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          isActive
            ? "text-white border-b-2 border-yellow-300 pb-2"
            : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2"
        }
      >
        Home
      </NavLink>

      <NavLink
        to="/matches"
        className={({ isActive }) =>
          isActive
            ? "text-white border-b-2 border-yellow-300 pb-2"
            : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2"
        }
      >
        Matches
      </NavLink>

      <NavLink
        to="/tournaments"
        className={({ isActive }) =>
          isActive
            ? "text-white border-b-2 border-yellow-300 pb-2"
            : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2"
        }
      >
        Tournaments
      </NavLink>

      <NavLink
        to="/news"
        className={({ isActive }) =>
          isActive
            ? "text-white border-b-2 border-yellow-300 pb-2"
            : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2"
        }
      >
        News
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) =>
          isActive
            ? "text-white border-b-2 border-yellow-300 pb-2"
            : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2"
        }
      >
        Stats
      </NavLink>
    </nav>
  );
}
