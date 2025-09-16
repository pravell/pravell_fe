import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import TabBar from './components/TabBar/TabBar';
import LoginPage from './pages/LoginPage/LoginPage';
import SignupPage from './pages/SignupPage/SignupPage';
import CreatePlanPage from './pages/CreatePlanPlge/CreatePlanPage';
import JoinByCodePage from './pages/JoinByCodePage/JoinbyCodePage';
import MapPage from './pages/MapPage/MapPage';
import MyPage from './pages/MyPage/MyPage';
import ChangeNicknamePage from './pages/MyPage/ChangeNicknamePage';
import PlanDetailPage from './pages/PlanDetailPage/PlanDetailPage';
import PlanSettingsPage from './pages/PlanSettingsPage/PlanSettingsPage';
import RouteDetail from './pages/PlanDetailPage/components/RouteDetail';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <div className="Header-Container">
        </div>
        <div className="App-content">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/my" element={<MyPage />} />
            <Route path="/create-plan" element={<CreatePlanPage />} />
            <Route path="/join-by-code" element={<JoinByCodePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/change-nickname" element={<ChangeNicknamePage />} />
            <Route path="/plan/:planId" element = {<PlanDetailPage />} /> 
            <Route path="/plan/:planId/settings" element={<PlanSettingsPage />} />
            <Route path="/plan/:planId/routes/:routeId" element={<RouteDetail />} />
          </Routes>
        </div>
        <TabBarController />
      </div>
    </Router>
  );
};

const TabBarController = () => {
  const location = useLocation();
  const hideTabBar = (location.pathname === '/login' || location.pathname === '/signup');

  return (
    <>
      {!hideTabBar && (
        <div className="TabBar-Container">
          <TabBar />
        </div>
      )}
    </>
  );
};

export default App;
