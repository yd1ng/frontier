import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BoardList from './pages/BoardList';
import BoardDetail from './pages/BoardDetail';
import BoardForm from './pages/BoardForm';
import RecruitList from './pages/RecruitList';
import RecruitDetail from './pages/RecruitDetail';
import RecruitForm from './pages/RecruitForm';
import Seats from './pages/Seats';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 게시판 */}
          <Route path="/boards" element={<BoardList />} />
          <Route path="/boards/:id" element={<BoardDetail />} />
          <Route
            path="/boards/new"
            element={
              <ProtectedRoute>
                <BoardForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:id/edit"
            element={
              <ProtectedRoute>
                <BoardForm />
              </ProtectedRoute>
            }
          />

          {/* 모집 */}
          <Route path="/recruits" element={<RecruitList />} />
          <Route path="/recruits/:id" element={<RecruitDetail />} />
          <Route
            path="/recruits/new"
            element={
              <ProtectedRoute>
                <RecruitForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruits/:id/edit"
            element={
              <ProtectedRoute>
                <RecruitForm />
              </ProtectedRoute>
            }
          />

          {/* 좌석 예약 */}
          <Route path="/seats" element={<Seats />} />

          {/* 관리자 패널 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

