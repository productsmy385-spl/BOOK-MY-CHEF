import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  // Active Booking Draft State
  provider: {
    id: '7cb20e81-a9f3-4217-a0bf-7bc3343ef812',
    name: 'Chef Raghavendra Rao',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn2XXRg9r81Z8f3uO4GcheOfa8iz1OGk9CCRHknu3aNDgjBpLDFl3ibvtQnbh650z6tXktdKgsOu4xvly0XNYCqXiX0lRzN8r9EtLDJwB3hLEJL7CezSTUxg1OFeyqEc4-v0v8bkBLj9tn1x_zNPKF3f41qvd8orqxOaWkpIEXMgP2XbmpsmCsPs-Cn6iUAoY6uQtwF0OkXhQlAuLXAUlQ7bAOtkmX5pSodbli95M',
    title: 'Culinary Master • 18+ Yrs Exp',
    cuisines: 'Andhra Royal • Telangana Home-Style',
    rating: 4.95,
    reviewsCount: 1240,
    baseFee: 1500,
    perPersonRate: 350,
  },

  step1Requirements: {
    eventType: 'Family Gathering',
    eventDate: '2026-11-28',
    timeSlot: 'Lunch (12:30 PM)',
    guestCount: 25,
    location: 'Jubilee Hills, Road No. 36, Hyderabad',
    budgetEstimate: 11000,
  },

  step2Preferences: {
    serviceMode: 'CHEF_VISITS_HOME', // 'CHEF_VISITS_HOME' | 'COOK_AND_DELIVER' | 'VENUE_BANQUET'
    dietary: 'Pure Vegetarian',
    spiceLevel: 'Medium Spice',
    appliancesProvided: true,
    specialNotes: 'Authentic Andhra festive meal with Gutti Vankaya and hot ghee pappu. Banana leaves requested.',
    referenceImages: [],
  },

  quotation: {
    baseVisitingFee: 1500,
    perHeadCost: 8750, // 25 guests * 350
    travelLogistics: 300,
    platformServiceFee: 450,
    taxGst: 0,
    totalPayable: 11000,
    advancePercentage: 30,
    advancePayable: 3300,
    balanceOnCompletion: 7700,
  },

  activeBooking: {
    bookingId: 'c4d3e2b1-0987-6543-21ba-fedcba987654',
    bookingReference: '#BMC-8942-HYD',
    status: 'CONFIRMED', // 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'
    paidAdvance: 3300,
    paymentMethod: 'UPI (Google Pay)',
    transactionId: 'TXN_987625121',
  },

  // Actions
  updateStep1: (fields) => set((state) => ({
    step1Requirements: { ...state.step1Requirements, ...fields },
    quotation: {
      ...state.quotation,
      perHeadCost: (fields.guestCount || state.step1Requirements.guestCount) * state.provider.perPersonRate,
      totalPayable: state.quotation.baseVisitingFee + ((fields.guestCount || state.step1Requirements.guestCount) * state.provider.perPersonRate) + state.quotation.travelLogistics + state.quotation.platformServiceFee,
      advancePayable: Math.round((state.quotation.baseVisitingFee + ((fields.guestCount || state.step1Requirements.guestCount) * state.provider.perPersonRate) + state.quotation.travelLogistics + state.quotation.platformServiceFee) * 0.3)
    }
  })),

  updateStep2: (fields) => set((state) => ({
    step2Preferences: { ...state.step2Preferences, ...fields }
  })),

  setConfirmedBooking: (bookingData) => set({
    activeBooking: bookingData
  }),
}));
