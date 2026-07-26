import { NavLink, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home.jsx";
import CodeReview from "./pages/CodeReview.jsx";
import History from "./pages/History.jsx";
import Metrics from "./pages/Metrics.jsx";
import Languages from "./pages/Languages.jsx";
import About from "./pages/About.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/review", label: "Code Review" },
  { to: "/history", label: "History" },
  { to: "/metrics", label: "Metrics" },
  { to: "/languages", label: "Languages" },
  { to: "/about", label: "About" },
];

export default function App() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">&gt;_</span>
          <span className="brand-name">codereview</span>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/review" element={<CodeReview />} />
          <Route path="/history" element={<History />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/languages" element={<Languages />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}