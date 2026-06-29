import { lazy, Suspense, createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user, loading, supabase,
    signIn: (d) => supabase.auth.signInWithPassword(d),
    signUp: (d) => supabase.auth.signUp(d),
    signOut: () => supabase.auth.signOut(),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` }
    })
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #E2E8F0', borderTopColor:'#4F46E5', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

const Landing   = lazy(() => import('./pages/Landing.jsx'))
const Login     = lazy(() => import('./pages/auth/Login.jsx'))
const Signup    = lazy(() => import('./pages/auth/Signup.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Run       = lazy(() => import('./pages/Run.jsx'))
const Pipeline  = lazy(() => import('./pages/Pipeline.jsx'))
const Settings  = lazy(() => import('./pages/Settings.jsx'))
const NotFound  = lazy(() => import('./pages/NotFound.jsx'))

const Loader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
    <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #E2E8F0', borderTopColor:'#4F46E5', animation:'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/"       element={<Landing />} />
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app"    element={<ProtectedRoute><Navigate to="/app/dashboard" replace /></ProtectedRoute>} />
            <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/run"       element={<ProtectedRoute><Run /></ProtectedRoute>} />
            <Route path="/app/pipeline"  element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
            <Route path="/app/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
