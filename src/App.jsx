import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '/src/contexts/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

const Landing   = lazy(() => import('./pages/Landing.jsx'));
const Login     = lazy(() => import('./pages/auth/Login.jsx'));
const Signup    = lazy(() => import('./pages/auth/Signup.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Run       = lazy(() => import('./pages/Run.jsx'));
const Pipeline  = lazy(() => import('./pages/Pipeline.jsx'));
const Settings  = lazy(() => import('./pages/Settings.jsx'));
const NotFound  = lazy(() => import('./pages/NotFound.jsx'));

const Loader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
    <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #E2E8F0', borderTopColor:'#4F46E5', animation:'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.4,0,0.2,1] }}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton duration={4000} />
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/"       element={<Landing />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app"           element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/app/dashboard" element={<Dashboard />} />
                <Route path="/app/run"       element={<Run />} />
                <Route path="/app/pipeline"  element={<Pipeline />} />
                <Route path="/app/settings"  element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}
