import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Ticket } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';

export default function VerifyTicket() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            verify();
        } else {
            setLoading(false);
        }
    }, [ticketId, isAuthenticated]);

    const verify = async () => {
        try {
            const { data } = await api.post(`/bookings/verify/${ticketId}`);
            setResult({ success: true, data: data.data, message: data.message });
        } catch (error) {
            setResult({ 
                success: false, 
                message: error.response?.data?.message || 'Verification failed',
                checkedInAt: error.response?.data?.checkedInAt
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                    <p className="text-eVEStro-muted mb-6">
                        You must be logged in as an Organizer or Volunteer to verify tickets.
                    </p>
                    <Link to="/login" className="btn-primary inline-flex">
                        Log In Now
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <h2 className="text-xl font-semibold animate-pulse">Verifying Ticket...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] ${result?.success ? 'bg-green-500/20' : 'bg-red-500/20'}`} />
            </div>

            <div className="glass-card max-w-md w-full p-8 relative z-10 text-center">
                <button 
                    onClick={() => navigate('/organizer')} 
                    className="absolute top-4 left-4 text-eVEStro-muted hover:text-white transition-colors flex items-center gap-1 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>

                <div className="mt-8 mb-6">
                    {result?.success ? (
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500/30 mb-4 animate-[bounce_1s_ease-in-out]">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500/30 mb-4">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                    )}

                    <h2 className={`text-2xl font-bold mb-2 ${result?.success ? 'text-green-400' : 'text-red-400'}`}>
                        {result?.success ? 'Ticket Verified! ✅' : 'Verification Failed ❌'}
                    </h2>
                    
                    <p className="text-eVEStro-muted mb-6 text-lg">
                        {result?.message}
                    </p>
                </div>

                {result?.success && result?.data && (
                    <div className="bg-eVEStro-dark rounded-xl p-5 text-left border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-eVEStro-muted uppercase tracking-wider">Attendee</p>
                                <p className="font-semibold text-lg">{result.data.attendee}</p>
                            </div>
                            <div>
                                <p className="text-xs text-eVEStro-muted uppercase tracking-wider">Event</p>
                                <p className="font-medium text-primary-400">{result.data.event}</p>
                            </div>
                            <div className="border-t border-eVEStro-border/50 pt-3 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-eVEStro-muted uppercase tracking-wider">Ticket ID</p>
                                    <p className="font-mono text-sm">{result.data.ticketId}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!result?.success && result?.checkedInAt && (
                    <div className="bg-eVEStro-dark/50 rounded-xl p-4 text-sm text-eVEStro-muted mt-4">
                        This ticket was already checked in at:<br/>
                        <span className="font-semibold text-white">{formatDate(result.checkedInAt)}</span>
                    </div>
                )}

                <div className="mt-8">
                    <button onClick={() => window.location.reload()} className="btn-secondary w-full">
                        Scan Another Screen / Reload
                    </button>
                </div>
            </div>
        </div>
    );
}
