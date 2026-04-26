import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Ticket, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import CollegeAutocomplete from '../components/CollegeAutocomplete';
import api from '../api/axios';

export default function Signup() {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'student', college: '', phone: '', referredBy: '',
    });
    
    // Verification states
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpInputs, setOtpInputs] = useState({ email: '' });
    const [otpSent, setOtpSent] = useState({ email: false });
    const [verifying, setVerifying] = useState({ email: false });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            const dest = user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/dashboard';
            navigate(dest, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const sendOTP = async (type) => {
        const value = type === 'email' ? form.email : form.phone;
        if (!value) return toast.error(`Please enter your ${type}`);
        
        setVerifying(prev => ({ ...prev, [type]: true }));
        try {
            await api.post('/auth/send-pre-signup-otp', { identifier: value, type });
            setOtpSent(prev => ({ ...prev, [type]: true }));
            toast.success(`OTP sent to ${value}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setVerifying(prev => ({ ...prev, [type]: false }));
        }
    };

    const verifyOTP = async (type) => {
        const value = type === 'email' ? form.email : form.phone;
        const otp = otpInputs[type];
        if (!otp) return toast.error('Please enter the OTP');

        setVerifying(prev => ({ ...prev, [type]: true }));
        try {
            await api.post('/auth/verify-pre-signup-otp', { identifier: value, otp });
            if (type === 'email') setEmailVerified(true);
            toast.success('Email verified!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setVerifying(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!emailVerified) {
            return toast.error('Please verify email first');
        }
        if (!form.name || !form.password) return toast.error('Please fill required fields');
        if (form.role === 'student' && !form.college?.trim()) return toast.error('Please enter your college name');
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        
        setLoading(true);
        try {
            const { confirmPassword, ...userData } = form;
            await register(userData);
            toast.success('Registration successful!');
            navigate(form.role === 'organizer' ? '/organizer' : '/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-lg relative">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold font-display mt-4">Create your account</h1>
                    <p className="text-evestro-muted mt-2">Join thousands of students on eVEStro</p>
                </div>

                <div className="glass-card p-8 blur-bg">
                    <div className="flex gap-2 mb-6">
                        {['student', 'organizer'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setForm({ ...form, role })}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${form.role === role
                                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                        : 'bg-evestro-dark border-evestro-border text-evestro-muted hover:border-evestro-muted'
                                    }`}
                            >
                                {role === 'student' ? '🎓 Student' : '🎪 Organizer'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="input-field" placeholder="John Doe" required />
                        </div>

                        {/* Email Verification Row */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Email *</label>
                            <div className="flex gap-2">
                                <input 
                                    type="email" 
                                    value={form.email} 
                                    disabled={emailVerified}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input-field flex-1" 
                                    placeholder="you@college.edu" 
                                />
                                {!emailVerified ? (
                                    <button 
                                        type="button"
                                        onClick={() => sendOTP('email')}
                                        disabled={verifying.email || !form.email}
                                        className="btn-primary !px-4 !py-2 text-sm"
                                    >
                                        {otpSent.email ? 'Resend' : 'Send OTP'}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 text-green-400 font-medium text-sm px-2">
                                        <CheckCircle2 size={16} /> Verified
                                    </div>
                                )}
                            </div>
                            {otpSent.email && !emailVerified && (
                                <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                    <input 
                                        type="text"
                                        placeholder="Enter OTP"
                                        className="input-field !py-1 text-center tracking-widest"
                                        value={otpInputs.email}
                                        onChange={(e) => setOtpInputs({...otpInputs, email: e.target.value})}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => verifyOTP('email')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg text-sm transition-all"
                                    >
                                        Verify
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phone *</label>
                            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="input-field" placeholder="+91 9876543210" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">College Name {form.role === 'student' && '*'}</label>
                            <CollegeAutocomplete 
                                value={form.college}
                                onChange={(val) => setForm({ ...form, college: val })}
                                placeholder="Search or type college name"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Password *</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="input-field pr-12" placeholder="Min 6 characters" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-evestro-muted hover:text-white transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                                <input type="password" value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    className="input-field" placeholder="••••••••" />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !emailVerified} 
                            className={`w-full flex items-center justify-center gap-2 mt-6 py-3 rounded-xl font-bold transition-all ${
                                !emailVerified 
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 active:scale-95'
                            }`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {!emailVerified ? <ShieldCheck size={18} /> : null}
                                    {!emailVerified ? 'Complete Verification to Sign Up' : 'Create Account'}
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-evestro-muted mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
