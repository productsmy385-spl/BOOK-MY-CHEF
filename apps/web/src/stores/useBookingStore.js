import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  // Active Booking Draft State
  provider: {
    id: 'ab33603d-aefb-414f-a4b9-145bcaf9154a',
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
    bookingId: '5f154cff-3dcf-43ad-b22a-793b3fac436a',
    bookingReference: '#BMC-6821-HYD',
    status: 'CONFIRMED', // 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'
    paidAdvance: 3300,
    paymentMethod: 'Razorpay UPI',
    transactionId: 'TXN_987625121',
  },

  // Actions
  setProvider: (newProvider) => set({ provider: { ...get().provider, ...newProvider } }),

  updateStep1: (fields) => set((state) => {
    const updated = { ...state.step1Requirements, ...fields };
    const guestCount = fields.guestCount !== undefined ? Number(fields.guestCount) : state.step1Requirements.guestCount;
    const perHead = guestCount * state.provider.perPersonRate;
    const total = state.quotation.baseVisitingFee + perHead + state.quotation.travelLogistics + state.quotation.platformServiceFee;
    const advance = Math.round(total * 0.3);

    return {
      step1Requirements: updated,
      quotation: {
        ...state.quotation,
        perHeadCost: perHead,
        totalPayable: total,
        advancePayable: advance,
        balanceOnCompletion: total - advance,
      }
    };
  }),

  updateStep2: (fields) => set((state) => ({
    step2Preferences: { ...state.step2Preferences, ...fields }
  })),

  setConfirmedBooking: (bookingData) => set({
    activeBooking: bookingData
  }),
}));
