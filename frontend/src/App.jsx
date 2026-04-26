import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import Wallet from './pages/Wallet';
import VerifyTicket from './pages/VerifyTicket';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Analytics } from "@vercel/analytics/next";


export default function App() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />

                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                    <Route
                        path="/dashboard"
                        element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/organizer"
                        element={<ProtectedRoute roles={['organizer']}><OrganizerDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/organizer/create"
                        element={<ProtectedRoute roles={['organizer']}><CreateEvent /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin"
                        element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/wallet"
                        element={<ProtectedRoute roles={['student', 'organizer', 'admin']}><Wallet /></ProtectedRoute>}
                    />
                    <Route path="/verify/:ticketId" element={<VerifyTicket />} />
                </Routes>
            </main>
            <Footer />
            <Toaster position="bottom-right" toastOptions={{
                duration: 3000,
                style: {
                    background: '#1a1a2e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            }} />
            <Analytics />
        </div>
    );
}
