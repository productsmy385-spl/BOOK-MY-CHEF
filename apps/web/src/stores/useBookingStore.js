import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  // Provider Selected by Customer for Active Booking Flow
  provider: {
    id: 'ab33603d-aefb-414f-a4b9-145bcaf9154a',
    name: 'Chef Raghavendra Rao',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn2XXRg9r81Z8f3uO4GcheOfa8iz1OGk9CCRHknu3aNDgjBpLDFl3ibvtQnbh650z6tXktdKgsOu4xvly0XNYCqXiX0lRzN8r9EtLDJwB3hLEJL7CezSTUxg1OFeyqEc4-v0v8bkBLj9tn1x_zNPKF3f41qvd8orqxOaWkpIEXMgP2XbmpsmCsPs-Cn6iUAoY6uQtwF0OkXhQlAuLXAUlQ7bAOtkmX5pSodbli95M',
    title: 'Culinary Master • 18+ Yrs Exp',
    cuisines: 'Andhra Royal • Telangana Home-Style',
    rating: 4.95,
    reviewsCount: 124,
    baseFee: 1500,
    perPersonRate: 350,
  },

  step1Requirements: {
    eventType: 'Family Celebration',
    eventDate: '',
    timeSlot: 'Lunch (12:30 PM)',
    guestCount: 15,
    location: '',
    budgetEstimate: 0,
  },

  step2Preferences: {
    serviceMode: 'CHEF_VISITS_HOME', // 'CHEF_VISITS_HOME' | 'COOK_AND_DELIVER' | 'VENUE_BANQUET'
    dietary: 'All Diets Accommodated',
    spiceLevel: 'Medium Spice',
    appliancesProvided: true,
    specialNotes: '',
    referenceImages: [],
  },

  quotation: {
    baseVisitingFee: 1500,
    perHeadCost: 5250, // 15 guests * 350
    travelLogistics: 300,
    platformServiceFee: 450,
    taxGst: 0,
    totalPayable: 7500,
    advancePercentage: 30,
    advancePayable: 2250,
    balanceOnCompletion: 5250,
  },

  // Active Real Persistent Booking (null by default for real production users)
  activeBooking: null,

  // Actions
  setProvider: (newProvider) => set({ provider: { ...get().provider, ...newProvider } }),

  updateStep1: (fields) => set((state) => {
    const updated = { ...state.step1Requirements, ...fields };
    const guestCount = fields.guestCount !== undefined ? Number(fields.guestCount) : state.step1Requirements.guestCount;
    const perHeadRate = state.provider?.perPersonRate || 350;
    const baseFee = state.quotation.baseVisitingFee || 1500;
    const perHead = guestCount * perHeadRate;
    const total = baseFee + perHead + state.quotation.travelLogistics + state.quotation.platformServiceFee;
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

  clearBookingDraft: () => set({
    activeBooking: null,
    step1Requirements: {
      eventType: 'Family Celebration',
      eventDate: '',
      timeSlot: 'Lunch (12:30 PM)',
      guestCount: 15,
      location: '',
      budgetEstimate: 0,
    },
    step2Preferences: {
      serviceMode: 'CHEF_VISITS_HOME',
      dietary: 'All Diets Accommodated',
      spiceLevel: 'Medium Spice',
      appliancesProvided: true,
      specialNotes: '',
      referenceImages: [],
    },
  }),
}));
