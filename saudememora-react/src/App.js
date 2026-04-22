import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;