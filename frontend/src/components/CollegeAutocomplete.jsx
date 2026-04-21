import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Check } from 'lucide-react';
import api from '../api/axios';

export default function CollegeAutocomplete({ value, onChange, placeholder = "Search for your college..." }) {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [allColleges, setAllColleges] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const fetchColleges = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/events/colleges/list');
                setAllColleges(data.data || []);
            } catch (error) {
                console.error("Failed to load colleges");
            } finally {
                setLoading(false);
            }
        };
        fetchColleges();
    }, []);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length > 1) {
            const filtered = allColleges.filter(c => 
                c.name.toLowerCase().includes(term.toLowerCase()) ||
                c.aliases.some(a => a.toLowerCase().includes(term.toLowerCase()))
            ).slice(0, 8); // Limit suggestions
            
            setSuggestions(filtered);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
        onChange(term);
    };

    const selectCollege = (college) => {
        setSearchTerm(college.name);
        onChange(college.name);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eVEStro-muted" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length > 1 && setIsOpen(true)}
                    className="input-field !pl-12 !pr-10"
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && (suggestions.length > 0 || searchTerm.length > 1) && (
                <div className="absolute z-[100] mt-2 w-full glass-card border-primary-500/30 overflow-hidden shadow-2xl animate-fade-in max-h-72 overflow-y-auto">
                    {suggestions.length > 0 ? (
                        <div className="py-2">
                            {suggestions.map((college, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectCollege(college)}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-primary-500/10 transition-colors text-left group"
                                >
                                    <MapPin className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-white group-hover:text-primary-300 transition-colors">
                                                {college.name}
                                            </p>
                                            {searchTerm.toLowerCase() === college.name.toLowerCase() && (
                                                <Check className="w-4 h-4 text-green-400" />
                                            )}
                                        </div>
                                        {college.aliases.length > 0 && (
                                            <p className="text-[10px] text-eVEStro-muted uppercase tracking-wider mt-0.5">
                                                AKA: {college.aliases.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-eVEStro-muted italic">" {searchTerm} "</p>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="mt-2 text-xs text-primary-400 hover:underline"
                            >
                                Use this name anyway
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
