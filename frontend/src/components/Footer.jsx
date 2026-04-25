import { Link } from 'react-router-dom';
import { Ticket, Instagram, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Footer() {
    const email = 'evestro26@gmail.com';

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(email);
        toast.success('Email copied!');
    };

    return (
        <footer className="bg-evestro-dark border-t border-evestro-border/30 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold font-display">
                                eVE<span className="gradient-text">Stro</span>
                            </span>
                        </Link>
                        <p className="text-evestro-muted text-sm leading-relaxed">
                            India's #1 college event platform. Discover, book, and manage campus events seamlessly.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Platform</h4>
                        <ul className="space-y-2">
                            <li><Link to="/events" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Browse Events</Link></li>
                            <li><Link to="/signup" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Create Account</Link></li>
                            <li><Link to="/signup" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Organize Events</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Categories</h4>
                        <ul className="space-y-2">
                            {['Tech', 'Fest', 'Music', 'Sports', 'Workshop'].map((cat) => (
                                <li key={cat}>
                                    <Link to={`/events?category=${cat}`} className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">{cat} Events</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">Connect</h4>
                        <div className="flex gap-4 mb-4">
                            <a 
                                href="https://www.instagram.com/_eVEStro?igsh=OTE50WNydTI3cW9w" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-10 h-10 rounded-xl bg-evestro-card border border-evestro-border flex items-center justify-center
                                         text-evestro-muted hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
                                title="Follow us on Instagram"
                            >
                                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </a>
                            <button 
                                onClick={handleCopyEmail}
                                className="w-10 h-10 rounded-xl bg-evestro-card border border-evestro-border flex items-center justify-center
                                         text-evestro-muted hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
                                title="Click to copy email"
                            >
                                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <button 
                            onClick={handleCopyEmail}
                            className="text-evestro-muted text-sm hover:text-primary-400 transition-colors flex items-center gap-2 group"
                        >
                            {email}
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>

                <div className="border-t border-evestro-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-evestro-muted text-sm">© 2026 eVEStro. Built with ❤️ for Indian colleges.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Privacy</a>
                        <a href="#" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Terms</a>
                        <a href="#" className="text-evestro-muted hover:text-primary-400 text-sm transition-colors">Support</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
