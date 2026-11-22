import { create } from 'zustand';

export const useProviderStore = create((set) => ({
  // 9-Step Onboarding State
  onboarding: {
    currentStep: 1,
    basicInfo: {
      fullName: '',
      brandName: '',
      phone: '',
      email: '',
      experienceYears: 0,
      bio: '',
      fssaiLicense: '',
    },
    roles: ['PRO_CHEF'],
    specializations: [],
    pricingModel: 'PER_PERSON',
    basePrice: 0,
    serviceRadiusKm: 25,
    serviceLocations: [],
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },

  // Operational Dashboard State (Clean initial state for real providers)
  metrics: {
    monthlyEarnings: 0,
    pendingLeadsCount: 0,
    confirmedEventsCount: 0,
    hostRating: 5.0,
    walletAvailable: 0,
    walletInEscrow: 0,
  },

  // Active Event-Day Checklist (populated when real event is scheduled today)
  eventChecklist: [],

  // Real Incoming Leads (populated from real host requests via API/PostgreSQL)
  incomingLeads: [],
  leads: [],

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
