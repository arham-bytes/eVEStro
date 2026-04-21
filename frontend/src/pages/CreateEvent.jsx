import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Calendar, MapPin, Tag, DollarSign, Users, FileText, Building2, Plus, Trash2, Clock } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CollegeAutocomplete from '../components/CollegeAutocomplete';

const CATEGORIES = ['Tech', 'Fest', 'Music', 'Sports', 'Workshop', 'Seminar', 'Other'];

export default function CreateEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', category: 'Tech', college: '', venue: '',
        date: '', time: '', price: 0, totalTickets: '', openForAll: true,
        registrationEndDate: '', ticketTiers: [],
    });
    const [imageFile, setImageFile] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addTier = () => {
        setForm({
            ...form,
            ticketTiers: [...form.ticketTiers, { name: '', basePrice: 0, quantity: 1, description: '' }]
        });
    };

    const removeTier = (index) => {
        const newTiers = [...form.ticketTiers];
        newTiers.splice(index, 1);
        setForm({ ...form, ticketTiers: newTiers });
    };

    const updateTier = (index, field, value) => {
        const newTiers = [...form.ticketTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setForm({ ...form, ticketTiers: newTiers });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.college || !form.venue || !form.date) {
            return toast.error('Please fill all required fields');
        }
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'ticketTiers') {
                    formData.append(key, JSON.stringify(form[key]));
                } else {
                    formData.append(key, form[key]);
                }
            });
            if (imageFile) formData.append('image', imageFile);

            await api.post('/events', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Event created! It will be reviewed by admin.');
            navigate('/organizer');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="section-heading mb-2">Create <span className="gradient-text">Event</span></h1>
                <p className="text-campus-muted">Fill in the details to create your event. It will be reviewed by admin before going live.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2">Event Banner</label>
                    <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed rounded-2xl transition-all ${imagePreview ? 'border-primary-500/50' : 'border-campus-border hover:border-primary-500/30'
                            } overflow-hidden`}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-campus-muted">
                                    <Upload className="w-10 h-10 mb-3 text-primary-400/50" />
                                    <p className="text-sm">Click to upload event banner</p>
                                    <p className="text-xs mt-1 text-campus-muted/60">JPG, PNG, WebP — Max 5MB</p>
                                </div>
                            )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-400" /> Title *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="input-field" placeholder="e.g. TechFest 2026 Hackathon" maxLength={120} />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="input-field h-32 resize-none" placeholder="Describe your event in detail..." maxLength={5000} />
                </div>

                {/* Category & College */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-400" /> Category *</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="input-field">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-campus-muted mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> College Name
                        </label>
                        <CollegeAutocomplete 
                            value={form.college}
                            onChange={(val) => setForm({ ...form, college: val })}
                            placeholder="Search your college (e.g. LPU, IIT...)"
                        />
                        <label className="flex items-center gap-2 text-sm text-campus-muted cursor-pointer mt-2">
                            <input type="checkbox" checked={form.openForAll} onChange={(e) => setForm({ ...form, openForAll: e.target.checked })} 
                                className="w-4 h-4 rounded border-campus-border text-primary-500 focus:ring-primary-500 bg-campus-dark" />
                            Open for all colleges
                        </label>
                    </div>
                </div>

                {/* Venue & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> Venue *</label>
                        <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
                            className="input-field" placeholder="e.g. Main Auditorium" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-400" /> Date *</label>
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="input-field" />
                    </div>
                </div>

                {/* Time */}
                <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input type="text" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="input-field" placeholder="e.g. 10:00 AM - 5:00 PM" />
                </div>

                {/* Registration End Date */}
                <div className="pt-4 border-t border-campus-border">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> Registration End Date</label>
                    <input type="date" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })}
                        className="input-field" />
                    <p className="text-xs mt-2 text-campus-muted">Tickets will not be sellable after this date. Leave empty to close only when event starts.</p>
                </div>

                {/* Ticket Tiers / Bundles */}
                <div className="pt-6 border-t border-campus-border">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold gradient-text">Ticket Offers & Bundles</h3>
                            <p className="text-sm text-campus-muted">Create special packages like "3 Tickets Pack" or "VIP Access"</p>
                        </div>
                        <button type="button" onClick={addTier} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Offer
                        </button>
                    </div>

                    {form.ticketTiers.length > 0 && (
                        <div className="space-y-4">
                            {form.ticketTiers.map((tier, index) => (
                                <div key={index} className="p-4 rounded-xl border border-campus-border bg-campus-dark/50 space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-campus-muted">Offer Name</label>
                                                    <input type="text" value={tier.name} onChange={(e) => updateTier(index, 'name', e.target.value)}
                                                        className="input-field py-2" placeholder="e.g. Early Bird Combo" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-campus-muted">Quantity (Tickets included)</label>
                                                    <input type="number" min="1" value={tier.quantity} onChange={(e) => updateTier(index, 'quantity', Number(e.target.value))}
                                                        className="input-field py-2" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-campus-muted">Price per bundle (₹)</label>
                                                    <input type="number" min="0" value={tier.basePrice} onChange={(e) => updateTier(index, 'basePrice', Number(e.target.value))}
                                                        className="input-field py-2" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-campus-muted">Description</label>
                                                    <input type="text" value={tier.description} onChange={(e) => updateTier(index, 'description', e.target.value)}
                                                        className="input-field py-2" placeholder="e.g. Save ₹100 on group entry" />
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeTier(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {tier.basePrice > 0 && (
                                        <p className="text-[10px] text-campus-muted">
                                            Customer pays: <span className="text-primary-400">₹{Math.ceil(tier.basePrice * 1.10)}</span> (includes platform fee)
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <button type="submit" disabled={loading} className="btn-primary w-full text-lg flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
}
