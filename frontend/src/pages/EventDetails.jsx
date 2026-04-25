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

    const [showParticipantModal, setShowParticipantModal] = useState(false);
    const [participantsData, setParticipantsData] = useState([]);
    
    // Initialize participants form based on team size or individual
    const initParticipantForms = () => {
        const count = event.registrationType === 'team' ? event.teamSize.min : 1;
        const initial = Array.from({ length: count }, () => ({
            name: '',
            email: '',
            customData: event.participantFields.reduce((acc, field) => ({ ...acc, [field.label]: '' }), {})
        }));
        setParticipantsData(initial);
        setShowParticipantModal(true);
    };

    const handleParticipantSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        for (const p of participantsData) {
            if (!p.name || !p.email) return toast.error('All member names and emails are required');
            for (const field of event.participantFields) {
                if (field.required && !p.customData[field.label]) {
                    return toast.error(`${field.label} is required for all participants`);
                }
            }
        }

        setBooking(true);
        try {
            const bookingPayload = { 
                eventId: id, 
                couponCode,
                tierId: selectedTierId || undefined,
                participants: participantsData,
                paymentMethod: event.price > 0 || (selectedTierId && event.ticketTiers.find(t => t._id === selectedTierId)?.price > 0) ? 'wallet' : 'free'
            };

            const { data } = await api.post('/bookings', bookingPayload);
            toast.success('Registration successful! 🎉');
            if (data.walletBalance !== undefined) {
                updateUser({ ...user, walletBalance: data.walletBalance });
            }
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBooking(false);
            setShowParticipantModal(false);
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
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-evestro-muted hover:text-white mb-6 transition-colors">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-evestro-darker via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className={`badge ${getCategoryBadgeClass(event.category)} backdrop-blur-sm`}>{event.category}</span>
                            {event.featured && <span className="badge bg-yellow-500/20 text-yellow-400">⭐ Featured</span>}
                        </div>
                    </div>

                    {/* Title & Meta */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-evestro-muted">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-400" /> {formatDate(event.date)}</span>
                            {event.time && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> {event.time}</span>}
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> {event.venue}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">About this event</h2>
                        <div className="text-evestro-muted whitespace-pre-line leading-relaxed">{event.description}</div>
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
                                <p className="text-sm text-evestro-muted">{event.organizer?.college || event.college}</p>
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
                            <p className="text-sm text-evestro-muted mt-1">per ticket</p>
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
                                    <span className="text-evestro-muted">Availability (Organizer View)</span>
                                    <span>{available > 0 ? `${available} left` : 'Sold out'}</span>
                                </div>
                                <div className="h-2 bg-evestro-dark rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${soldPercentage > 80 ? 'bg-red-500' : 'bg-primary-500'}`}
                                        style={{ width: `${soldPercentage}%` }} />
                                </div>
                                <p className="text-xs text-evestro-muted mt-1">{event.ticketsSold} / {event.totalTickets} sold</p>
                            </div>
                        ) : (
                            <div className="flex justify-between text-base mb-2 p-3 bg-evestro-dark/50 rounded-xl border border-evestro-border/30">
                                <span className="text-evestro-muted">Status</span>
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
                                        className={`w-full p-3 rounded-xl border text-left transition-all ${!selectedTierId ? 'border-primary-500 bg-primary-500/10' : 'border-evestro-border hover:border-evestro-border/60'}`}
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
                                            className={`w-full p-3 rounded-xl border text-left transition-all ${selectedTierId === tier._id ? 'border-primary-500 bg-primary-500/10' : 'border-evestro-border hover:border-evestro-border/60'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold">{tier.name}</span>
                                                <span className="text-primary-400 font-bold">{formatPrice(tier.price)}</span>
                                            </div>
                                            <p className="text-[10px] text-evestro-muted">{tier.description || `Includes ${tier.quantity} tickets`}</p>
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
                            <div className="flex items-center justify-between p-3 rounded-xl bg-evestro-dark/50 border border-evestro-border/30">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-evestro-muted">Wallet Balance</span>
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

                        {/* Registration Type Badge */}
                        {event.registrationType === 'team' && (
                            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-medium text-primary-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Team Registration
                                </span>
                                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">
                                    {event.teamSize.min === event.teamSize.max ? event.teamSize.min : `${event.teamSize.min}-${event.teamSize.max}`} Members
                                </span>
                            </div>
                        )}

                        {/* Book Button */}
                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    toast.error('Please login to book tickets');
                                    return navigate('/login');
                                }
                                
                                // Price check before showing modal
                                let finalPrice = event.price;
                                if (selectedTierId && event.ticketTiers) {
                                    const tier = event.ticketTiers.find(t => t._id === selectedTierId);
                                    if (tier) finalPrice = tier.price;
                                }

                                if (finalPrice > 0 && walletBalance < finalPrice) {
                                    return toast.error(`Insufficient balance! Need ₹${finalPrice}`);
                                }

                                initParticipantForms();
                            }}
                            disabled={booking || available <= 0 || isRegistrationEnded}
                            className={`w-full flex items-center justify-center gap-2 text-lg py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                                isRegistrationEnded
                                    ? 'bg-evestro-dark border border-evestro-border text-evestro-muted cursor-not-allowed opacity-60'
                                    : currentPrice === 0
                                        ? 'btn-primary'
                                        : hasEnoughBalance
                                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/10'
                                            : 'bg-evestro-dark border border-evestro-border text-evestro-muted cursor-not-allowed opacity-60'
                            }`}
                        >
                            {booking ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isRegistrationEnded ? (
                                'Registration Closed'
                            ) : available <= 0 ? (
                                'Sold Out'
                            ) : event.registrationType === 'team' ? (
                                <>
                                    <Users className="w-5 h-5" /> Register Team
                                </>
                            ) : currentPrice === 0 ? (
                                <>
                                    <Ticket className="w-5 h-5" /> Book Free Ticket
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" /> Book with Wallet
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

            {/* Participant Details Modal */}
            {showParticipantModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="glass-card p-6 md:p-8 max-w-2xl w-full my-8 animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowParticipantModal(false)} className="absolute top-4 right-4 text-evestro-muted hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold font-display">Registration <span className="gradient-text">Details</span></h3>
                            <p className="text-sm text-evestro-muted mt-1">Please provide details for {event.registrationType === 'team' ? `all ${participantsData.length} members` : 'the participant'}.</p>
                        </div>

                        <form onSubmit={handleParticipantSubmit} className="space-y-8">
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {participantsData.map((participant, pIdx) => (
                                    <div key={pIdx} className="p-5 rounded-2xl bg-evestro-dark/40 border border-evestro-border/50 space-y-4">
                                        <div className="flex items-center justify-between border-b border-evestro-border/30 pb-3 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                                                {event.registrationType === 'team' ? `Member #${pIdx + 1}` : 'Participant Info'}
                                            </span>
                                            {pIdx === 0 && event.registrationType === 'team' && <span className="text-[10px] text-evestro-muted">(Team Lead)</span>}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-medium text-evestro-muted mb-1 ml-1">Full Name</label>
                                                <input type="text" required value={participant.name} 
                                                    onChange={(e) => {
                                                        const newP = [...participantsData];
                                                        newP[pIdx].name = e.target.value;
                                                        setParticipantsData(newP);
                                                    }}
                                                    className="input-field py-2 text-sm" placeholder="John Doe" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-medium text-evestro-muted mb-1 ml-1">Email</label>
                                                <input type="email" required value={participant.email} 
                                                    onChange={(e) => {
                                                        const newP = [...participantsData];
                                                        newP[pIdx].email = e.target.value;
                                                        setParticipantsData(newP);
                                                    }}
                                                    className="input-field py-2 text-sm" placeholder="john@example.com" />
                                            </div>
                                        </div>

                                        {/* Custom Fields defined by Organizer */}
                                        {event.participantFields && event.participantFields.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                {event.participantFields.map((field, fIdx) => (
                                                    <div key={fIdx}>
                                                        <label className="block text-[11px] font-medium text-evestro-muted mb-1 ml-1">
                                                            {field.label} {field.required && '*'}
                                                        </label>
                                                        <input 
                                                            type={field.type || 'text'} 
                                                            required={field.required}
                                                            value={participant.customData[field.label] || ''}
                                                            onChange={(e) => {
                                                                const newP = [...participantsData];
                                                                newP[pIdx].customData[field.label] = e.target.value;
                                                                setParticipantsData(newP);
                                                            }}
                                                            className="input-field py-2 text-sm" 
                                                            placeholder={`Enter ${field.label}`} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={booking} className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-glow">
                                {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalize Booking <CreditCard className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Share QR Modal */}
            {showShareQR && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareQR(false)}>
                    <div className="glass-card p-8 max-w-sm w-full text-center animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowShareQR(false)} className="absolute top-4 right-4 text-evestro-muted hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-semibold mb-2">Share this Event</h3>
                        <p className="text-sm text-evestro-muted mb-6">Let your friends scan this QR code to view the event online.</p>
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

