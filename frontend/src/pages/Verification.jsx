import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Mail, Phone, Loader2, RefreshCw, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Verification() {
    const { user, updateUser, logout } = useAuth();
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [loading, setLoading] = useState({ email: false, phone: false });
    const [resendTimer, setResendTimer] = useState({ email: 0, phone: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.isEmailVerified && user.isPhoneVerified) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setResendTimer(prev => ({
                email: Math.max(0, prev.email - 1),
                phone: Math.max(0, prev.phone - 1)
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerifyEmail = async () => {
        if (!emailOtp) return toast.error('Enter Email OTP');
        setLoading(prev => ({ ...prev, email: true }));
        try {
            await api.post('/auth/verify-email', { otp: emailOtp });
            toast.success('Email verified! ✅');
            const updatedUser = { ...user, isEmailVerified: true };
            updateUser(updatedUser);
            if (updatedUser.isPhoneVerified) navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(prev => ({ ...prev, email: false }));
        }
    };

    const handleVerifyPhone = async () => {
        if (!phoneOtp) return toast.error('Enter Phone OTP');
        setLoading(prev => ({ ...prev, phone: true }));
        try {
            await api.post('/auth/verify-phone', { otp: phoneOtp });
            toast.success('Phone verified! ✅');
            const updatedUser = { ...user, isPhoneVerified: true };
            updateUser(updatedUser);
            if (updatedUser.isEmailVerified) navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(prev => ({ ...prev, phone: false }));
        }
    };

    const handleResend = async (type) => {
        try {
            await api.post('/auth/resend-otp', { type });
            toast.success(`New OTP sent to your ${type}`);
            setResendTimer(prev => ({ ...prev, [type]: 60 }));
        } catch (error) {
            toast.error('Could not resend OTP');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#050508]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-lg relative">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500/10 rounded-3xl mb-6 border border-primary-500/20 relative">
                        <ShieldCheck className="w-10 h-10 text-primary-500" />
                        <div className="absolute inset-0 bg-primary-500/20 blur-2xl -z-10 animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold font-display text-white mb-3">Verification <span className="gradient-text">Required</span></h1>
                    <p className="text-evestro-muted max-w-sm mx-auto leading-relaxed">
                        To keep the community safe, we need to verify your identity.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Email Verification Card */}
                    <div className={`glass-card p-6 transition-all border-l-4 ${user.isEmailVerified ? 'border-l-green-500 opacity-60' : 'border-l-primary-500'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${user.isEmailVerified ? 'bg-green-500/10 text-green-400' : 'bg-primary-500/10 text-primary-400'}`}>
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Email Address</h3>
                                    <p className="text-xs text-evestro-muted">{user.email}</p>
                                </div>
                            </div>
                            {user.isEmailVerified && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">VERIFIED</span>
                            )}
                        </div>

                        {!user.isEmailVerified && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        maxLength="6"
                                        value={emailOtp}
                                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit OTP"
                                        className="input-field tracking-[0.5em] text-center font-bold text-xl"
                                    />
                                    <button 
                                        onClick={handleVerifyEmail}
                                        disabled={loading.email}
                                        className="btn-primary !px-4"
                                    >
                                        {loading.email ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-evestro-muted uppercase tracking-wider italic">Check your inbox & spam</span>
                                    <button 
                                        disabled={resendTimer.email > 0} 
                                        onClick={() => handleResend('email')}
                                        className="text-[10px] font-bold text-primary-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${resendTimer.email > 0 ? 'animate-spin' : ''}`} />
                                        {resendTimer.email > 0 ? `Resend in ${resendTimer.email}s` : 'RESEND OTP'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Phone Verification Card */}
                    <div className={`glass-card p-6 transition-all border-l-4 ${user.isPhoneVerified ? 'border-l-green-500 opacity-60' : 'border-l-accent-500'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${user.isPhoneVerified ? 'bg-green-500/10 text-green-400' : 'bg-accent-500/10 text-accent-400'}`}>
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Mobile Number</h3>
                                    <p className="text-xs text-evestro-muted">{user.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            {user.isPhoneVerified && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">VERIFIED</span>
                            )}
                        </div>

                        {!user.isPhoneVerified && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        maxLength="6"
                                        value={phoneOtp}
                                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit OTP"
                                        className="input-field tracking-[0.5em] text-center font-bold text-xl border-accent-500/30 focus:border-accent-500"
                                    />
                                    <button 
                                        onClick={handleVerifyPhone}
                                        disabled={loading.phone}
                                        className="bg-accent-600 hover:bg-accent-700 text-white px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading.phone ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-evestro-muted uppercase tracking-wider italic">OTP sent via SMS (Simulated)</span>
                                    <button 
                                        disabled={resendTimer.phone > 0} 
                                        onClick={() => handleResend('phone')}
                                        className="text-[10px] font-bold text-accent-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${resendTimer.phone > 0 ? 'animate-spin' : ''}`} />
                                        {resendTimer.phone > 0 ? `Resend in ${resendTimer.phone}s` : 'RESEND OTP'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 text-center">
                        <button 
                            onClick={logout}
                            className="text-evestro-muted hover:text-red-400 text-xs transition-colors flex items-center gap-2 mx-auto"
                        >
                            Wait, use a different account? Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
