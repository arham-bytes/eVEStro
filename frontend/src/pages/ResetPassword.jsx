import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ResetPassword() {
    const { resettoken } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords don't match");
        }

        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            await api.put(`/auth/resetpassword/${resettoken}`, { password });
            setSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10 animate-fade-in">
                {!success && (
                    <Link to="/login" className="flex items-center gap-2 text-campus-muted hover:text-white mb-6 w-fit transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                )}

                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                            <Lock className="w-8 h-8 text-primary-400" />
                        </div>
                        <h1 className="text-2xl font-bold font-display mb-2">Create New Password</h1>
                        <p className="text-campus-muted">
                            {success 
                                ? "Your password has been successfully reset."
                                : "Please enter your new password below."}
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4 animate-[bounce_1s_ease-in-out]" />
                                <h3 className="text-lg font-semibold text-white mb-1">Password Changed!</h3>
                                <p className="text-sm text-campus-muted">You will be redirected to the login page momentarily.</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary w-full"
                            >
                                Go to Login Now
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-campus-muted ml-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="Enter new password (min. 6 chars)"
                                    />
                                    <Lock className="w-5 h-5 text-campus-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-campus-muted ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="Confirm new password"
                                    />
                                    <Lock className="w-5 h-5 text-campus-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
