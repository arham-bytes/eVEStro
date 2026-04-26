const Event = require('../models/Event');
const User = require('../models/User');
const { validationResult, body } = require('express-validator');
const INDIA_UNIVERSITIES = require('../data/india_universities');

exports.eventValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(['Tech', 'Fest', 'Music', 'Sports', 'Workshop', 'Seminar', 'Other']).withMessage('Invalid category'),
    body('college').trim().notEmpty().withMessage('College is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('totalTickets').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Total tickets must be at least 1'),
];

// Platform markup percentage (10%)
const PLATFORM_MARKUP = 0.10;

// Helper to expand college search with aliases
const expandCollegeSearch = (term) => {
    if (!term) return '';
    const termLower = term.toLowerCase().trim();
    
    // Find matching university/alias
    const match = INDIA_UNIVERSITIES.find(u => 
        u.name.toLowerCase().includes(termLower) || 
        u.aliases.some(a => a.toLowerCase() === termLower)
    );

    if (match) {
        // Create an OR regex for the input, the full name, and all aliases
        const terms = new Set([term, match.name, ...match.aliases]);
        return Array.from(terms).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    }
    
    return term;
};

// @desc    Get all approved events (public)
// @route   GET /api/events
exports.getEvents = async (req, res, next) => {
    try {
        const { category, college, search, startDate, endDate, page = 1, limit = 12 } = req.query;

        const query = { status: 'approved' };

        if (category) query.category = category;
        
        if (college) {
            const expandedCollege = expandCollegeSearch(college);
            query.college = { $regex: expandedCollege, $options: 'i' };
        }

        if (search) {
            const expandedSearch = expandCollegeSearch(search);
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { college: { $regex: expandedSearch || search, $options: 'i' } },
            ];
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const total = await Event.countDocuments(query);
        const events = await Event.find(query)
            .populate('organizer', 'name college')
            .sort({ featured: -1, date: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
exports.getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email college');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

// @desc    Create event
// @route   POST /api/events
exports.createEvent = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const basePrice = Number(req.body.price) || 0;
        const customerPrice = basePrice > 0 ? Math.ceil(basePrice * (1 + PLATFORM_MARKUP)) : 0;

        if (req.body.acceptedTerms !== 'true' && req.body.acceptedTerms !== true) {
            return res.status(400).json({ success: false, message: 'You must accept the Terms & Conditions to create an event' });
        }

        const eventData = {
            ...req.body,
            organizer: req.user._id,
            basePrice,
            price: customerPrice,
        };

        // Handle image upload
        if (req.file) {
            eventData.image = req.file.path || req.file.url || `/uploads/${req.file.filename}`;
        }

        // Handle ticket tiers
        let ticketTiers = req.body.ticketTiers;
        if (typeof ticketTiers === 'string') {
            try { ticketTiers = JSON.parse(ticketTiers); } catch (e) { ticketTiers = null; }
        }

        if (ticketTiers && Array.isArray(ticketTiers)) {
            eventData.ticketTiers = ticketTiers.map(tier => {
                const base = Number(tier.basePrice) || 0;
                return {
                    ...tier,
                    basePrice: base,
                    price: base > 0 ? Math.ceil(base * (1 + PLATFORM_MARKUP)) : 0,
                    quantity: Number(tier.quantity) || 1
                };
            });
        }

        // Handle team registration and participant fields
        if (typeof req.body.participantFields === 'string') {
            try { eventData.participantFields = JSON.parse(req.body.participantFields); } catch (e) {}
        }
        if (typeof req.body.teamSize === 'string') {
            try { eventData.teamSize = JSON.parse(req.body.teamSize); } catch (e) {}
        }

        const event = await Event.create(eventData);
        await event.populate('organizer', 'name college');

        res.status(201).json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Ensure user is event owner or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
        }

        if (req.file) {
            req.body.image = req.file.path || req.file.url || `/uploads/${req.file.filename}`;
        }

        // Recalculate markup if price is being updated
        if (req.body.price !== undefined) {
            const basePrice = Number(req.body.price) || 0;
            req.body.basePrice = basePrice;
            req.body.price = basePrice > 0 ? Math.ceil(basePrice * (1 + PLATFORM_MARKUP)) : 0;
        }

        // Handle ticket tiers update
        let ticketTiers = req.body.ticketTiers;
        if (typeof ticketTiers === 'string') {
            try {
                ticketTiers = JSON.parse(ticketTiers);
            } catch (error) {
                ticketTiers = null;
            }
        }

        if (ticketTiers && Array.isArray(ticketTiers)) {
            req.body.ticketTiers = ticketTiers.map(tier => {
                const base = Number(tier.basePrice) || 0;
                return {
                    ...tier,
                    basePrice: base,
                    price: base > 0 ? Math.ceil(base * (1 + PLATFORM_MARKUP)) : 0,
                    quantity: Number(tier.quantity) || 1
                };
            });
        }

        if (typeof req.body.participantFields === 'string') {
            try { req.body.participantFields = JSON.parse(req.body.participantFields); } catch (e) {}
        }
        if (typeof req.body.teamSize === 'string') {
            try { req.body.teamSize = JSON.parse(req.body.teamSize); } catch (e) {}
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('organizer', 'name college');

        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get organizer's events
// @route   GET /api/events/my/events
exports.getMyEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .populate('volunteers', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

// @desc    Add coupon to event
// @route   POST /api/events/:id/coupon
exports.addCoupon = async (req, res, next) => {
    try {
        const { code, discountPercent, maxUses } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        event.coupons.push({ code: code.toUpperCase(), discountPercent, maxUses });
        await event.save();

        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

// @desc    Add volunteer to event
// @route   POST /api/events/:id/volunteers
exports.addVolunteer = async (req, res, next) => {
    try {
        const { email } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User with this email not found' });
        }

        if (event.volunteers.includes(user._id)) {
            return res.status(400).json({ success: false, message: 'User is already a volunteer for this event' });
        }

        if (event.organizer.toString() === user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Organizer cannot be added as a volunteer' });
        }

        event.volunteers.push(user._id);
        await event.save();

        res.json({ success: true, message: 'Volunteer added successfully', data: event });
    } catch (error) {
        next(error);
    }
};

// @desc    Get events where user is a volunteer
// @route   GET /api/events/volunteer/events
exports.getVolunteerEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ volunteers: req.user._id })
            .sort({ createdAt: -1 })
            .populate('organizer', 'name college');

        res.json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all supported colleges/universities
// @route   GET /api/events/colleges
exports.getColleges = async (req, res, next) => {
    try {
        res.json({ success: true, data: INDIA_UNIVERSITIES });
    } catch (error) {
        next(error);
    }
};
