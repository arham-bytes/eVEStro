import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email address');

        setLoading(true);
        try {
            await api.post('/auth/forgotpassword', { email });
            setSuccess(true);
            toast.success('Password reset email sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
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
                <Link to="/login" className="flex items-center gap-2 text-campus-muted hover:text-white mb-6 w-fit transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>

                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                            <Mail className="w-8 h-8 text-primary-400" />
                        </div>
                        <h1 className="text-2xl font-bold font-display mb-2">Forgot Password?</h1>
                        <p className="text-campus-muted">
                            {success 
                                ? "Check your email for the reset link."
                                : "No worries, we'll send you reset instructions."}
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3 text-left">
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-400">Email sent to {email}</p>
                                    <p className="text-xs text-campus-muted mt-1">Please check your spam or junk folder if you don't see it within a few minutes.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                }}
                                className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                            >
                                Try another email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-campus-muted ml-1 flex items-center justify-between">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="Enter your registered email"
                                    />
                                    <Mail className="w-5 h-5 text-campus-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
