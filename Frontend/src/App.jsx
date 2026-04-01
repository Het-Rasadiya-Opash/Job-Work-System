import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ManageFirm from "./pages/ManageFirm";
import ManageParty from "./pages/ManageParty";
import ManageDesign from "./pages/ManageDesign";
import ManageJobCard from "./pages/ManageJobCard";
import DashboardOverview from "./pages/DashboardOverview";
import ProtectedRoute from "./utils/ProtectedRoute";
import ManageBroker from "./pages/ManageBroker";
import ReportPage from "./pages/ReportPage";
import ChallanPrint from "./components/ChallanPrint";
import ManageChallan from "./pages/ManageChallan";
import ManageMachine from "./pages/ManageMachine";
import ManageEmployee from "./pages/ManageEmployee";
import ManageProduction from "./pages/ManageProduction";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="firm" element={<ManageFirm />} />
        <Route path="party" element={<ManageParty />} />
        <Route path="broker" element={<ManageBroker />} />
        <Route path="design" element={<ManageDesign />} />
        <Route path="jobcard" element={<ManageJobCard />} />
        <Route path="challans" element={<ManageChallan />} />
        <Route path="machine" element={<ManageMachine />} />
        <Route path="employee" element={<ManageEmployee />} />
        <Route path="production" element={<ManageProduction />} />
        <Route path="reports" element={<ReportPage />} />
      </Route>

      {/* Standalone Route (No Sidebar/Navbar) */}
      <Route
        path="/print-challan/:id"
        element={
          <ProtectedRoute>
            <ChallanPrint />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
