import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Calendar, MapPin, Tag, DollarSign, Users, FileText, Building2, Plus, Trash2, Clock, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CollegeAutocomplete from '../components/CollegeAutocomplete';

const CATEGORIES = ['Tech', 'Fest', 'Music', 'Sports', 'Esports', 'Workshop', 'Seminar', 'Other'];

export default function CreateEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', category: 'Tech', college: '', venue: '',
        date: '', startTime: '', endTime: '', price: 0, totalTickets: '', openForAll: true,
        registrationEndDate: '', ticketTiers: [],
        registrationType: 'individual',
        teamSize: { min: 1, max: 1 },
        participantFields: [{ label: 'Full Name', required: true, type: 'text' }],
    });
    const [imageFile, setImageFile] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    const addField = () => {
        setForm({
            ...form,
            participantFields: [...form.participantFields, { label: '', required: true, type: 'text' }]
        });
    };

    const removeField = (index) => {
        const newFields = [...form.participantFields];
        newFields.splice(index, 1);
        setForm({ ...form, participantFields: newFields });
    };

    const updateField = (index, field, value) => {
        const newFields = [...form.participantFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setForm({ ...form, participantFields: newFields });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.college || !form.venue || !form.date) {
            return toast.error('Please fill all required fields');
        }
        if (!acceptedTerms) {
            return toast.error('Please accept the Terms & Conditions to proceed');
        }
        setLoading(true);
        try {
            const formData = new FormData();
            
            // Combine times for the backend
            const combinedTime = `${form.startTime} - ${form.endTime}`;
            
            Object.keys(form).forEach(key => {
                if (['ticketTiers', 'participantFields', 'teamSize'].includes(key)) {
                    formData.append(key, JSON.stringify(form[key]));
                } else if (key !== 'startTime' && key !== 'endTime') {
                    formData.append(key, form[key]);
                }
            });
            formData.append('time', combinedTime);
            
            if (imageFile) formData.append('image', imageFile);
            formData.append('acceptedTerms', acceptedTerms);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create <span className="gradient-text">Event</span></h1>
                <p className="text-evestro-muted">Set up your event details, ticket types, and registration requirements.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
                {/* 1. Basic Information Section */}
                <section className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-primary-400">
                        <FileText className="w-5 h-5" /> Basic Information
                    </h2>
                    
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Event Banner</label>
                        <label className="block cursor-pointer">
                            <div className={`border-2 border-dashed rounded-2xl transition-all ${imagePreview ? 'border-primary-500/50' : 'border-evestro-border hover:border-primary-500/30'
                                } overflow-hidden`}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-evestro-muted">
                                        <Upload className="w-10 h-10 mb-3 text-primary-400/50" />
                                        <p className="text-sm">Click to upload event banner</p>
                                        <p className="text-xs mt-1 text-evestro-muted/60">JPG, PNG, WebP — Max 5MB</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Event Title *</label>
                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="input-field" placeholder="e.g. Annual Cultural Fest 2026" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="input-field h-32 resize-none" placeholder="Provide a detailed description of the event..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-400" /> Category *</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="input-field">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary-400" /> Host College *</label>
                            <CollegeAutocomplete 
                                value={form.college}
                                onChange={(val) => setForm({ ...form, college: val })}
                                placeholder="Search college..."
                            />
                            <label className="flex items-center gap-2 text-sm text-evestro-muted cursor-pointer mt-3">
                                <input type="checkbox" checked={form.openForAll} onChange={(e) => setForm({ ...form, openForAll: e.target.checked })} 
                                    className="w-4 h-4 rounded border-evestro-border text-primary-500 focus:ring-primary-500 bg-evestro-dark" />
                                <span>Open for all college students</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* 2. Logistics Section */}
                <section className="pt-6 border-t border-evestro-border/30 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-primary-400">
                        <MapPin className="w-5 h-5" /> Date & Venue
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-400" /> Event Date *</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> Exact Venue *</label>
                            <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
                                className="input-field" placeholder="e.g. Block C, Seminar Hall 2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> Start Time *</label>
                            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> End Time *</label>
                            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="input-field" />
                        </div>
                    </div>
                </section>

                {/* 3. Registration Setup Section */}
                <section className="pt-6 border-t border-evestro-border/30 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-primary-400">
                        <Users className="w-5 h-5" /> Registration Types
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-evestro-dark/30 border border-evestro-border">
                        <div>
                            <label className="block text-sm font-medium mb-4">Registration Mode</label>
                            <div className="flex gap-4">
                                <button type="button" 
                                    onClick={() => setForm({ ...form, registrationType: 'individual' })}
                                    className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                        form.registrationType === 'individual' 
                                        ? 'bg-primary-500/10 border-primary-500 text-primary-400' 
                                        : 'bg-evestro-dark border-evestro-border text-evestro-muted hover:border-evestro-border/60'
                                    }`}>
                                    Individual
                                </button>
                                <button type="button" 
                                    onClick={() => setForm({ ...form, registrationType: 'team' })}
                                    className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                        form.registrationType === 'team' 
                                        ? 'bg-primary-500/10 border-primary-500 text-primary-400' 
                                        : 'bg-evestro-dark border-evestro-border text-evestro-muted hover:border-evestro-border/60'
                                    }`}>
                                    Team/Group
                                </button>
                            </div>
                        </div>

                        {form.registrationType === 'team' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-evestro-muted">Min Team Size</label>
                                    <input type="number" min="1" value={form.teamSize.min} 
                                        onChange={(e) => setForm({ ...form, teamSize: { ...form.teamSize, min: Number(e.target.value) }})}
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-evestro-muted">Max Team Size</label>
                                    <input type="number" min="1" value={form.teamSize.max} 
                                        onChange={(e) => setForm({ ...form, teamSize: { ...form.teamSize, max: Number(e.target.value) }})}
                                        className="input-field" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Participant Details Customizer */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-white">Participant Detail Requirements</h3>
                                <p className="text-xs text-evestro-muted">Add custom fields you need from every participant (e.g. Uni ID, Linktree)</p>
                            </div>
                            <button type="button" onClick={addField} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Field
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {form.participantFields.map((field, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-evestro-dark/20 p-3 rounded-xl border border-evestro-border/30">
                                    <input type="text" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none px-2" placeholder="Field Label (e.g. Registration Number)" />
                                    <select value={field.type} onChange={(e) => updateField(idx, 'type', e.target.value)}
                                        className="bg-evestro-dark border-none text-xs rounded-lg text-primary-400/80">
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-[10px] text-evestro-muted shrink-0">
                                        <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                            className="w-3 h-3 rounded bg-evestro-dark border-evestro-border" />
                                        Required
                                    </label>
                                    <button type="button" onClick={() => removeField(idx)} className="text-red-400/60 hover:text-red-400 px-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. Ticketing Section */}
                <section className="pt-6 border-t border-evestro-border/30 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-primary-400">
                        <DollarSign className="w-5 h-5" /> Ticketing & Offers
                    </h2>

                    {/* Base Ticket (General Admission) */}
                    <div className="p-6 rounded-2xl bg-primary-500/5 border border-primary-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-primary-400">General Admission (Base Price)</h3>
                            <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-1 rounded-full uppercase tracking-wider">Required</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-evestro-muted">Price for Single Ticket (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-evestro-muted">₹</span>
                                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                        className="input-field pl-8" placeholder="0 for Free" />
                                </div>
                                <p className="text-[10px] mt-2 text-evestro-muted">Platform fee of 10% will be added automatically.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-evestro-muted">Total Available Tickets</label>
                                <input type="number" min="1" value={form.totalTickets} onChange={(e) => setForm({ ...form, totalTickets: e.target.value })}
                                    className="input-field" placeholder="e.g. 500" />
                            </div>
                        </div>
                    </div>

                    {/* Combo Offers Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Special Offers & Combo Bundles</h3>
                            <button type="button" onClick={addTier} className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-2 rounded-full border-primary-500/30">
                                <Plus className="w-3 h-3" /> Add Combo/Offer
                            </button>
                        </div>

                        {form.ticketTiers.map((tier, index) => (
                            <div key={index} className="p-5 rounded-2xl border border-evestro-border bg-evestro-dark/40 space-y-4 animate-slide-up">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-1">
                                            <label className="block text-[10px] uppercase font-bold mb-1 text-primary-400/70">Offer Name</label>
                                            <input type="text" value={tier.name} onChange={(e) => updateTier(index, 'name', e.target.value)}
                                                className="input-field py-2 text-sm" placeholder="e.g. 3 Tickets Pack" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold mb-1 text-primary-400/70">Tickets Included</label>
                                            <input type="number" min="1" value={tier.quantity} onChange={(e) => updateTier(index, 'quantity', Number(e.target.value))}
                                                className="input-field py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold mb-1 text-primary-400/70">Bundle Price (₹)</label>
                                            <input type="number" min="0" value={tier.basePrice} onChange={(e) => updateTier(index, 'basePrice', Number(e.target.value))}
                                                className="input-field py-2 text-sm" />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeTier(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <input type="text" value={tier.description} onChange={(e) => updateTier(index, 'description', e.target.value)}
                                    className="w-full bg-evestro-dark/50 border border-evestro-border/50 rounded-lg py-1.5 px-3 text-xs outline-none" placeholder="Short description (e.g. Ideal for groups of 3)" />
                            </div>
                        ))}
                    </div>

                    {/* Registration Deadline */}
                    <div className="p-4 rounded-xl bg-evestro-dark/30 border border-evestro-border">
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-evestro-muted"><Clock className="w-4 h-4" /> Registration Deadline</label>
                        <input type="date" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })}
                            className="input-field py-2" />
                        <p className="text-[10px] mt-2 text-evestro-muted/60 Italics">Leave empty to auto-close when the event starts.</p>
                    </div>
                </section>

                <div className="pt-8 space-y-6">
                    <div className="glass-card p-6 bg-evestro-dark/20 border-evestro-border/30">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-primary-400">
                            <ShieldCheck className="w-4 h-4" /> Terms & Conditions for Organizers
                        </h3>
                        <div className="text-[11px] text-evestro-muted leading-relaxed h-32 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            <p>The Event Organizer agrees that all ticket sales for events listed on eVEStro will be conducted exclusively through the eVEStro platform for the duration of the event listing. The Organizer shall not sell, distribute, or offer tickets for the same event through any other platform, website, or offline channels without prior written consent from eVEStro.</p>
                            <p>All payments collected from users will be processed through eVEStro. The platform will deduct applicable service fees and commissions, and the remaining amount will be settled to the Event Organizer within the agreed settlement period.</p>
                            <p>Refunds, if applicable, will be governed by the event-specific refund policy set by the Organizer. eVEStro will not be liable for refunds unless explicitly stated.</p>
                            <p>eVEStro acts solely as a technology platform facilitating ticket bookings and is not responsible for the execution, quality, or cancellation of events.</p>
                            <p>Any fraudulent activity, misuse of the platform, or violation of terms may result in suspension or termination of access without prior notice.</p>
                        </div>
                        <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms} 
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 rounded border-evestro-border bg-evestro-dark text-primary-500 focus:ring-primary-500 transition-all cursor-pointer"
                                />
                            </div>
                            <span className="text-sm text-evestro-muted group-hover:text-evestro-light transition-colors">
                                I agree to the Event Organizer Terms and Conditions
                            </span>
                        </label>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-xl font-bold flex items-center justify-center gap-2 shadow-glow hover:shadow-primary-500/20">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '🚀 Launch Event'}
                    </button>
                    <p className="text-center text-xs text-evestro-muted">By clicking launch, you agree to our platform policies.</p>
                </div>
            </form>
        </div>
    );
}
