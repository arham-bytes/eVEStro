import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, MapPin, Users, Tag, Clock, CreditCard, Loader2, ArrowLeft, Share2, Ticket, Wallet, QrCode, Download, X } from 'lucide-react';
import { formatDate, formatPrice, getCategoryBadgeClass } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, updateUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);
    const [showShareQR, setShowShareQR] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState('');

    useEffect(() => {
        fetchEvent();
        if (isAuthenticated) {
            fetchWalletBalance();
        }
    }, [id, isAuthenticated]);

    const fetchEvent = async () => {
        try {
            const { data } = await api.get(`/events/${id}`);
            setEvent(data.data);
        } catch (error) {
            toast.error('Event not found');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            const { data } = await api.get('/wallet');
            setWalletBalance(data.data.balance);
        } catch (error) {
            // Wallet fetch failed silently
        }
    };

    const handleBooking = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to book tickets');
            return navigate('/login');
        }

        setBooking(true);
        try {
            const bookingPayload = { 
                eventId: id, 
                couponCode,
                tierId: selectedTierId || undefined
            };

            if (event.price === 0 && !selectedTierId) {
                // Free event — book directly
                const { data } = await api.post('/bookings', bookingPayload);
                toast.success('Ticket booked successfully! 🎉');
                navigate('/dashboard');
                return;
            }

            // Paid event — determine price based on tier if selected
            let finalPrice = event.price;
            if (selectedTierId && event.ticketTiers) {
                const tier = event.ticketTiers.find(t => t._id === selectedTierId);
                if (tier) finalPrice = tier.price;
            }

            if (finalPrice > 0 && walletBalance < finalPrice) {
                toast.error(`Insufficient wallet balance! You need ₹${finalPrice} but have ₹${walletBalance}. Please add money to your wallet.`);
                return;
            }

            // Pay with wallet
            const { data } = await api.post('/bookings', {
                ...bookingPayload,
                paymentMethod: 'wallet',
            });

            if (data.success && data.data) {
                toast.success('Ticket booked with wallet! 🎉');
                setWalletBalance(data.walletBalance);
                updateUser({ ...user, walletBalance: data.walletBalance });
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    const downloadQR = () => {
        const canvas = document.getElementById('share-qr-code');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `event-${id}-qr.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!event) return null;

    const isUnlimited = !event.totalTickets;
    const available = isUnlimited ? Infinity : (event.totalTickets - event.ticketsSold);
    const soldPercentage = isUnlimited ? 0 : Math.round((event.ticketsSold / event.totalTickets) * 100);
    
    let currentPrice = event.price;
    if (selectedTierId && event.ticketTiers) {
        const tier = event.ticketTiers.find(t => t._id === selectedTierId);
        if (tier) currentPrice = tier.price;
    }

    const hasEnoughBalance = walletBalance >= currentPrice;
    const isOrganizer = isAuthenticated && user?._id === event.organizer?._id;
    
    const isRegistrationEnded = event.isRegistrationClosed || (event.registrationEndDate && new Date() > new Date(event.registrationEndDate));

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-campus-muted hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="relative rounded-2xl overflow-hidden h-64 md:h-96">
                        {event.image ? (
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-accent-600/30 flex items-center justify-center">
                                <Tag className="w-20 h-20 text-primary-400/40" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-campus-darker via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className={`badge ${getCategoryBadgeClass(event.category)} backdrop-blur-sm`}>{event.category}</span>
                            {event.featured && <span className="badge bg-yellow-500/20 text-yellow-400">⭐ Featured</span>}
                        </div>
                    </div>

                    {/* Title & Meta */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-campus-muted">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-400" /> {formatDate(event.date)}</span>
                            {event.time && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> {event.time}</span>}
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> {event.venue}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">About this event</h2>
                        <div className="text-campus-muted whitespace-pre-line leading-relaxed">{event.description}</div>
                    </div>

                    {/* Organizer */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Organized by</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold">
                                {event.organizer?.name?.charAt(0) || 'O'}
                            </div>
                            <div>
                                <p className="font-semibold">{event.organizer?.name}</p>
                                <p className="text-sm text-campus-muted">{event.organizer?.college || event.college}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar — Booking Card */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6 sticky top-24 space-y-6">
                        <div className="text-center">
                            <p className={`text-4xl font-bold ${event.price === 0 ? 'text-green-400' : 'gradient-text'}`}>
                                {formatPrice(event.price)}
                            </p>
                            <p className="text-sm text-campus-muted mt-1">per ticket</p>
                        </div>

                        {/* Registration Status */}
                        {isRegistrationEnded ? (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                <p className="text-red-400 font-semibold flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" /> Registration Closed
                                </p>
                                <p className="text-[10px] text-red-400/60 mt-1">Check back for future events</p>
                            </div>
                        ) : isOrganizer ? (
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-campus-muted">Availability (Organizer View)</span>
                                    <span>{available > 0 ? `${available} left` : 'Sold out'}</span>
                                </div>
                                <div className="h-2 bg-campus-dark rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${soldPercentage > 80 ? 'bg-red-500' : 'bg-primary-500'}`}
                                        style={{ width: `${soldPercentage}%` }} />
                                </div>
                                <p className="text-xs text-campus-muted mt-1">{event.ticketsSold} / {event.totalTickets} sold</p>
                            </div>
                        ) : (
                            <div className="flex justify-between text-base mb-2 p-3 bg-campus-dark/50 rounded-xl border border-campus-border/30">
                                <span className="text-campus-muted">Status</span>
                                <span className={`font-semibold ${available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {available > 0 ? 'Tickets Available' : 'Sold Out'}
                                </span>
                            </div>
                        )}

                        {/* Ticket Tier Selection */}
                        {event.ticketTiers && event.ticketTiers.length > 0 && !isRegistrationEnded && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">Select Package</label>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setSelectedTierId('')}
                                        className={`w-full p-3 rounded-xl border text-left transition-all ${!selectedTierId ? 'border-primary-500 bg-primary-500/10' : 'border-campus-border hover:border-campus-border/60'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Standard Entry</span>
                                            <span className="text-primary-400 font-bold">{formatPrice(event.price)}</span>
                                        </div>
                                    </button>
                                    {event.ticketTiers.map(tier => (
                                        <button 
                                            key={tier._id}
                                            onClick={() => setSelectedTierId(tier._id)}
                                            className={`w-full p-3 rounded-xl border text-left transition-all ${selectedTierId === tier._id ? 'border-primary-500 bg-primary-500/10' : 'border-campus-border hover:border-campus-border/60'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold">{tier.name}</span>
                                                <span className="text-primary-400 font-bold">{formatPrice(tier.price)}</span>
                                            </div>
                                            <p className="text-[10px] text-campus-muted">{tier.description || `Includes ${tier.quantity} tickets`}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-primary-400" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-primary-400" />
                                <span>{event.venue}, {event.college}</span>
                            </div>
                            {isOrganizer && event.totalTickets && (
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-primary-400" />
                                    <span>{event.totalTickets} total capacity</span>
                                </div>
                            )}
                        </div>

                        {/* Coupon */}
                        {event.price > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Have a coupon?</label>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="Enter code"
                                    className="input-field text-sm"
                                />
                            </div>
                        )}

                        {/* Wallet Balance (for logged-in users with paid events) */}
                        {isAuthenticated && currentPrice > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-campus-dark/50 border border-campus-border/30">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-campus-muted">Wallet Balance</span>
                                </div>
                                <span className={`text-sm font-semibold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                                    ₹{walletBalance.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {/* Insufficient balance warning */}
                        {isAuthenticated && currentPrice > 0 && !hasEnoughBalance && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-400 mb-2">
                                    Insufficient balance. You need ₹{currentPrice} to book.
                                </p>
                                <a href="/wallet" className="text-xs text-primary-400 font-semibold hover:underline">
                                    + Add Money to Wallet →
                                </a>
                            </div>
                        )}

                        {/* Book Button */}
                        <button
                            onClick={handleBooking}
                            disabled={booking || available <= 0 || isRegistrationEnded}
                            className={`w-full flex items-center justify-center gap-2 text-lg py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                                isRegistrationEnded
                                    ? 'bg-campus-dark border border-campus-border text-campus-muted cursor-not-allowed opacity-60'
                                    : currentPrice === 0
                                        ? 'btn-primary'
                                        : hasEnoughBalance
                                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/10'
                                            : 'bg-campus-dark border border-campus-border text-campus-muted cursor-not-allowed opacity-60'
                            }`}
                        >
                            {booking ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isRegistrationEnded ? (
                                'Registration Closed'
                            ) : available <= 0 ? (
                                'Sold Out'
                            ) : currentPrice === 0 ? (
                                <>
                                    <Ticket className="w-5 h-5" /> Book Free Ticket
                                </>
                            ) : hasEnoughBalance ? (
                                <>
                                    <Wallet className="w-5 h-5" /> Pay ₹{currentPrice} from Wallet
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-5 h-5" /> Insufficient Balance
                                </>
                            )}
                        </button>

                        {/* Share */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Link copied!');
                                }}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                            >
                                <Share2 className="w-4 h-4" /> Copy Link
                            </button>
                            <button
                                onClick={() => setShowShareQR(true)}
                                className="btn-secondary !bg-primary-500/10 !text-primary-400 !border-primary-500/30 hover:!bg-primary-500/20 flex-1 flex items-center justify-center gap-2 text-sm"
                            >
                                <QrCode className="w-4 h-4" /> Share QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share QR Modal */}
            {showShareQR && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareQR(false)}>
                    <div className="glass-card p-8 max-w-sm w-full text-center animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowShareQR(false)} className="absolute top-4 right-4 text-campus-muted hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-semibold mb-2">Share this Event</h3>
                        <p className="text-sm text-campus-muted mb-6">Let your friends scan this QR code to view the event online.</p>
                        <div className="bg-white rounded-2xl p-4 inline-block mb-6">
                            <QRCodeCanvas
                                id="share-qr-code"
                                value={window.location.href}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                                marginSize={1}
                            />
                        </div>
                        <button onClick={downloadQR} className="btn-primary w-full flex justify-center items-center gap-2">
                            <Download className="w-4 h-4" /> Download QR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

