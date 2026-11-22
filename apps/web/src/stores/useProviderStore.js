import { create } from 'zustand';

export const useProviderStore = create((set) => ({
  // 9-Step Onboarding State
  onboarding: {
    currentStep: 1,
    basicInfo: {
      fullName: 'Chef Raghavendra Rao',
      brandName: 'Royal Dakshin Culinary Studio',
      phone: '+91 98490 12345',
      email: 'raghavendra.chef@atelier.in',
      experienceYears: 18,
      bio: 'Former Executive Chef at Taj Falaknuma. Specializing in authentic royal Andhra feasts, Telangana heritage curries, and banana leaf banquet hospitality.',
      fssaiLicense: '13622011000492',
    },
    roles: ['PRO_CHEF', 'HOME_CHEF', 'CATERER'],
    specializations: ['ANDHRA', 'TELANGANA', 'SOUTH_INDIAN', 'VEGETARIAN'],
    pricingModel: 'PER_PERSON',
    basePrice: 1499,
    serviceRadiusKm: 30,
    serviceLocations: ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kondapur'],
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },

  // Operational Dashboard State
  metrics: {
    monthlyEarnings: 142800,
    pendingLeadsCount: 4,
    confirmedEventsCount: 12,
    hostRating: 4.95,
    walletAvailable: 48500,
    walletInEscrow: 62000,
  },

  // Active Event-Day Checklist
  eventChecklist: [
    { id: 1, title: 'Fresh Ingredients Procured & Checked', completed: true, timestamp: '08:30 AM' },
    { id: 2, title: 'Departed Base Kitchen (GPS Sharing Active)', completed: true, timestamp: '10:00 AM' },
    { id: 3, title: 'Arrived at Host Venue (Jubilee Hills)', completed: true, timestamp: '10:45 AM' },
    { id: 4, title: 'Kitchen Sanitized & Cooking Underway', completed: true, timestamp: '11:15 AM' },
    { id: 5, title: 'Feast Plated & Served Warm', completed: false, timestamp: 'Pending' },
    { id: 6, title: 'Kitchen Sanitized & Handover Complete', completed: false, timestamp: 'Pending' },
  ],

  // Incoming Leads
  incomingLeads: [
    {
      id: 'lead-1',
      hostName: 'Meera Nambiar',
      eventType: 'Family Gathering / Housewarming',
      eventDate: '28 Nov 2026',
      timeSlot: 'Lunch (12:30 PM)',
      guestCount: 25,
      location: 'Jubilee Hills, Road No. 36',
      cuisine: 'Andhra Royal Festive Meal',
      deliveryMode: 'Chef Visits Home',
      estimatedAmount: 11000,
      status: 'PENDING_RESPONSE',
    },
    {
      id: 'lead-2',
      hostName: 'Vikramaditya V.',
      eventType: 'Executive Board Dinner',
      eventDate: '02 Dec 2026',
      timeSlot: 'Dinner (08:00 PM)',
      guestCount: 12,
      location: 'Banjara Hills, Road No. 12',
      cuisine: 'Chettinad & Coastal Seafood',
      deliveryMode: 'Chef Visits Home',
      estimatedAmount: 18000,
      status: 'PENDING_RESPONSE',
    }
  ],

  // Actions
  toggleChecklistStep: (id) => set((state) => ({
    eventChecklist: state.eventChecklist.map((step) =>
      step.id === id ? { ...step, completed: !step.completed } : step
    ),
  })),

  setOnboardingStep: (step) => set((state) => ({
    onboarding: { ...state.onboarding, currentStep: step }
  })),

  updateOnboarding: (data) => set((state) => ({
    onboarding: { ...state.onboarding, ...data }
  })),
}));
