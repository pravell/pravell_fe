import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import TabBar from './components/TabBar/TabBar';
import './App.css';

const MapPage = () => <div>지도 페이지</div>;
const MyPage = () => <div>마이페이지</div>;
const LoginPage = () => <div>로그인 페이지</div>;
const CreatePlanPage = () => <div>여행 플랜 생성 페이지</div>
const JoinByCodePage = () => <div>초대 코드로 참여</div>

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
          </Routes>
        </div>
        <div className="TabBar-Container">
          <TabBar />
        </div>
      </div>
    </Router>
  );
};

export default App;
