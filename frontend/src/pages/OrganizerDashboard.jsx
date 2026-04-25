import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Users, Ticket, DollarSign, Calendar, Eye, QrCode, Loader2, CheckCircle, XCircle, Clock, X, Shield, Camera } from 'lucide-react';
import { formatDate, formatPrice, getCategoryBadgeClass } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import QRScanner from '../components/QRScanner';

export default function OrganizerDashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [scanTicketId, setScanTicketId] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    // Volunteers
    const [selectedVolunteerEvent, setSelectedVolunteerEvent] = useState(null);
    const [volunteerEmail, setVolunteerEmail] = useState('');
    const [addingVolunteer, setAddingVolunteer] = useState(false);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const { data } = await api.get('/events/my/events');
            setEvents(data.data || []);
        } catch (error) {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async (eventId) => {
        setBookingsLoading(true);
        try {
            const { data } = await api.get(`/bookings/event/${eventId}`);
            setBookings(data.data || []);
        } catch (error) {
            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    };

    const handleVerifyTicket = async (ticketIdToVerify = null) => {
        const id = ticketIdToVerify || scanTicketId;
        if (!id.trim()) return;
        
        try {
            const { data } = await api.post(`/bookings/verify/${id}`);
            setScanResult({ success: true, message: data.message, data: data.data });
            toast.success('Ticket verified! ✅');
            setScanTicketId('');
        } catch (error) {
            setScanResult({ success: false, message: error.response?.data?.message || 'Verification failed' });
            toast.error(error.response?.data?.message || 'Verification failed');
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        // Sometimes the decoded text is the full URL, we want to extract the Ticket ID
        let ticketId = decodedText;
        if (decodedText.includes('/verify/')) {
            ticketId = decodedText.split('/verify/')[1];
        }
        setScanTicketId(ticketId);
        handleVerifyTicket(ticketId);
    };

    const handleAddVolunteer = async () => {
        if (!volunteerEmail.trim()) return;
        setAddingVolunteer(true);
        try {
            await api.post(`/events/${selectedVolunteerEvent._id}/volunteers`, { email: volunteerEmail });
            toast.success('Volunteer added successfully!');
            setVolunteerEmail('');
            // Refetch events to get updated volunteers
            fetchMyEvents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add volunteer');
        } finally {
            setAddingVolunteer(false);
        }
    };

    const handleToggleRegistration = async (eventId, currentStatus) => {
        try {
            await api.put(`/events/${eventId}`, { isRegistrationClosed: !currentStatus });
            toast.success(`Registration ${!currentStatus ? 'closed' : 'opened'} successfully!`);
            fetchMyEvents();
        } catch (error) {
            toast.error('Failed to update registration status');
        }
    };

    const totalRevenue = events.reduce((sum, e) => sum + (e.ticketsSold * (e.basePrice || e.price)), 0);
    const totalTicketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return <Clock className="w-4 h-4 text-yellow-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="section-heading mb-2">Organizer <span className="gradient-text">Dashboard</span></h1>
                    <p className="text-evestro-muted">Manage your events, {user?.name}.</p>
                </div>
                <Link to="/organizer/create" className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Create Event
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { icon: Calendar, label: 'Total Events', value: events.length, color: 'text-primary-400' },
                    { icon: Ticket, label: 'Tickets Sold', value: totalTicketsSold, color: 'text-green-400' },
                    { icon: DollarSign, label: 'Your Earnings', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-yellow-400' },
                    { icon: CheckCircle, label: 'Approved', value: events.filter(e => e.status === 'approved').length, color: 'text-blue-400' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-6 text-center">
                        <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-evestro-muted">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* QR Scanner */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-primary-400" /> Check-in Scanner</h2>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input type="text" value={scanTicketId} onChange={(e) => setScanTicketId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyTicket()}
                            className="input-field w-full pl-10" placeholder="Enter or scan Ticket ID (e.g. CP-XXXXXXXXXXXX)" />
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-300 transition-colors"
                            title="Scan QR Code"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={() => handleVerifyTicket()} className="btn-primary">Verify</button>
                </div>
                {scanResult && (
                    <div className={`mt-3 p-3 rounded-xl text-sm ${scanResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {scanResult.message}
                        {scanResult.data && <span> — {scanResult.data.attendee} for {scanResult.data.event}</span>}
                    </div>
                )}
            </div>

            {/* Events List */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 glass-card">
                    <Calendar className="w-16 h-16 text-evestro-muted/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                    <p className="text-evestro-muted mb-6">Create your first event and start selling tickets.</p>
                    <Link to="/organizer/create" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Create Event</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Events</h2>
                    {events.map((event) => (
                        <div key={event._id} className="glass-card p-6">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(event.status)}
                                        <h3 className="text-lg font-semibold">{event.title}</h3>
                                        <span className={`badge ${getCategoryBadgeClass(event.category)}`}>{event.category}</span>
                                        {event.isRegistrationClosed && (
                                            <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                                                Registration Closed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-evestro-muted">
                                        <span>{formatDate(event.date)}</span>
                                        <span>{event.venue}, {event.college}</span>
                                        <span>{event.ticketsSold}/{event.totalTickets} sold</span>
                                        <span>Your price: {formatPrice(event.basePrice || event.price)}</span>
                                        {event.basePrice > 0 && event.price !== event.basePrice && (
                                            <span className="text-evestro-muted/60">Customer pays: {formatPrice(event.price)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => handleToggleRegistration(event._id, event.isRegistrationClosed)}
                                        className={`btn-secondary text-sm !px-3 !py-2 flex items-center gap-1 ${event.isRegistrationClosed ? '!text-green-400 !border-green-500/30 hover:!bg-green-500/10' : '!text-red-400 !border-red-500/30 hover:!bg-red-500/10'}`}
                                        title={event.isRegistrationClosed ? 'Open Registration' : 'Close Registration'}
                                    >
                                        {event.isRegistrationClosed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {event.isRegistrationClosed ? 'Open' : 'Close'} Sales
                                    </button>
                                    <button onClick={() => setSelectedVolunteerEvent(event)}
                                        className="btn-secondary text-sm !px-3 !py-2 flex items-center gap-1">
                                        <Shield className="w-4 h-4" /> Volunteers
                                    </button>
                                    <button onClick={() => { setSelectedEvent(selectedEvent === event._id ? null : event._id); fetchBookings(event._id); }}
                                        className="btn-secondary text-sm !px-3 !py-2 flex items-center gap-1">
                                        <Users className="w-4 h-4" /> Registrations
                                    </button>
                                    <Link to={`/events/${event._id}`} className="btn-secondary text-sm !px-3 !py-2 flex items-center gap-1">
                                        <Eye className="w-4 h-4" /> View
                                    </Link>
                                </div>
                            </div>

                            {/* Registrations Dropdown */}
                            {selectedEvent === event._id && (
                                <div className="mt-4 pt-4 border-t border-evestro-border/50">
                                    {bookingsLoading ? (
                                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin mx-auto" />
                                    ) : bookings.length === 0 ? (
                                        <p className="text-sm text-evestro-muted text-center py-4">No registrations yet</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead><tr className="text-left text-evestro-muted border-b border-evestro-border/30">
                                                    <th className="pb-2">Attendee</th><th className="pb-2">Email</th><th className="pb-2">College</th><th className="pb-2">Status</th><th className="pb-2">Booked</th>
                                                </tr></thead>
                                                <tbody>
                                                    {bookings.map((b) => (
                                                        <tr key={b._id} className="border-b border-evestro-border/10">
                                                            <td className="py-2">{b.user?.name}</td>
                                                            <td className="py-2 text-evestro-muted">{b.user?.email}</td>
                                                            <td className="py-2 text-evestro-muted">{b.user?.college || '-'}</td>
                                                            <td className="py-2"><span className={`badge text-xs ${b.status === 'checked-in' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{b.status}</span></td>
                                                            <td className="py-2 text-evestro-muted">{formatDate(b.createdAt)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Volunteer Management Modal */}
            {selectedVolunteerEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedVolunteerEvent(null)}>
                    <div className="glass-card p-6 max-w-md w-full animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedVolunteerEvent(null)} className="absolute top-4 right-4 text-evestro-muted hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold mb-2">Manage Volunteers</h2>
                        <p className="text-sm text-evestro-muted mb-6">Volunteers can scan check-in QR codes using their own accounts for <strong className="text-white">{selectedVolunteerEvent.title}</strong>.</p>
                        
                        <div className="mb-6">
                            <h3 className="font-medium mb-3">Current Volunteers</h3>
                            {selectedVolunteerEvent.volunteers && selectedVolunteerEvent.volunteers.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedVolunteerEvent.volunteers.map(v => (
                                        <li key={v._id} className="text-sm bg-evestro-dark px-3 py-2 rounded flex justify-between items-center">
                                            <span>{v.name}</span>
                                            <span className="text-evestro-muted text-xs">{v.email}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-evestro-muted">No volunteers added yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Add Volunteer</h3>
                            <div className="flex gap-2 text-sm">
                                <input 
                                    type="email" 
                                    className="input-field flex-1" 
                                    placeholder="Registered user's email" 
                                    value={volunteerEmail}
                                    onChange={e => setVolunteerEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddVolunteer()}
                                />
                                <button onClick={handleAddVolunteer} disabled={addingVolunteer || !volunteerEmail.trim()} className="btn-primary flex-shrink-0">
                                    {addingVolunteer ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* QR Scanner Modal */}
            {isScannerOpen && (
                <QRScanner 
                    onScan={handleScanSuccess} 
                    onClose={() => setIsScannerOpen(false)} 
                />
            )}
        </div>
    );
}
