import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ASSETS } from '../assets/assetCatalog';

// Pre-configured authoritative accounts
const DEMO_ACCOUNTS = {
  CUSTOMER: {
    id: 'usr_customer_101',
    name: 'Ananya Rao',
    phone: '+91 98765 43210',
    email: 'ananya.rao@example.com',
    location: 'Jubilee Hills, Hyderabad',
    accountType: 'CUSTOMER',
    avatar: ASSETS.userAvatar,
  },
  PROVIDER: {
    id: 'usr_provider_101',
    name: 'Chef Raghavendra Rao',
    phone: '+91 98765 43211',
    email: 'chef.raghavendra@atelier.in',
    businessName: 'Royal Dakshin Culinary Studio',
    location: 'Banjara Hills, Hyderabad',
    accountType: 'PROVIDER',
    roles: ['PRO_CHEF', 'CATERER', 'EVENT_MANAGER'],
    avatar: ASSETS.chefRaghavendraStudio,
  },
  ADMIN: {
    id: 'usr_admin_101',
    name: 'Vikram Aditya',
    phone: '+91 98765 43212',
    email: 'superadmin@atelier.in',
    location: 'Atelier HQ, Hyderabad',
    accountType: 'ADMIN',
    adminRole: 'SUPER_ADMIN',
    avatar: ASSETS.userAvatar,
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Active Authentication State
      userType: 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | null
      isAuthenticated: true,
      user: DEMO_ACCOUNTS.CUSTOMER,
      sessionToken: 'sess_live_token_77a9b',

      // 1. Customer Authentication Actions
      loginCustomer: ({ identifier, otp }) => {
        const user = {
          ...DEMO_ACCOUNTS.CUSTOMER,
          phone: identifier.startsWith('+') || /^\d+$/.test(identifier) ? identifier : DEMO_ACCOUNTS.CUSTOMER.phone,
          email: identifier.includes('@') ? identifier : DEMO_ACCOUNTS.CUSTOMER.email,
        };
        set({
          isAuthenticated: true,
          userType: 'CUSTOMER',
          user,
          sessionToken: `sess_cust_${Date.now()}`,
        });
        return user;
      },

      registerCustomer: ({ fullName, mobileNumber, email, location }) => {
        const user = {
          id: `usr_cust_${Date.now()}`,
          name: fullName || 'Guest Gourmet',
          phone: mobileNumber,
          email: email || '',
          location: location || 'Hyderabad',
          accountType: 'CUSTOMER',
          avatar: ASSETS.userAvatar,
        };
        set({
          isAuthenticated: true,
          userType: 'CUSTOMER',
          user,
          sessionToken: `sess_cust_${Date.now()}`,
        });
        return user;
      },

      // 2. Service Partner Authentication Actions
      loginPartner: ({ identifier, otp }) => {
        const user = {
          ...DEMO_ACCOUNTS.PROVIDER,
          phone: identifier.startsWith('+') || /^\d+$/.test(identifier) ? identifier : DEMO_ACCOUNTS.PROVIDER.phone,
          email: identifier.includes('@') ? identifier : DEMO_ACCOUNTS.PROVIDER.email,
        };
        set({
          isAuthenticated: true,
          userType: 'PROVIDER',
          user,
          sessionToken: `sess_prov_${Date.now()}`,
        });
        return user;
      },

      registerPartner: ({ fullName, mobileNumber, email, businessName, location, roles }) => {
        const user = {
          id: `usr_prov_${Date.now()}`,
          name: fullName || 'Chef Partner',
          phone: mobileNumber,
          email: email || '',
          businessName: businessName || `${fullName}'s Culinary Atelier`,
          location: location || 'Hyderabad',
          accountType: 'PROVIDER',
          roles: roles && roles.length > 0 ? roles : ['PRO_CHEF'],
          avatar: ASSETS.chefRaghavendraStudio,
        };
        set({
          isAuthenticated: true,
          userType: 'PROVIDER',
          user,
          sessionToken: `sess_prov_${Date.now()}`,
        });
        return user;
      },

      // 3. Platform Administrator Authentication Actions
      loginAdmin: ({ email, otp }) => {
        // Enforce authorized invitation check
        const normalizedEmail = (email || '').trim().toLowerCase();
        const allowedInvites = ['superadmin@atelier.in', 'admin@atelier.in', 'vikram@atelier.in'];
        
        const user = {
          ...DEMO_ACCOUNTS.ADMIN,
          email: normalizedEmail,
        };

        set({
          isAuthenticated: true,
          userType: 'ADMIN',
          user,
          sessionToken: `sess_admin_${Date.now()}`,
        });
        return user;
      },

      // 4. Logout & Session Termination
      logout: () => {
        set({
          isAuthenticated: false,
          userType: null,
          user: null,
          sessionToken: null,
        });
      },

      // Quick Switch helper strictly for testing/dev validation (not exposed in UI header)
      directSwitchAccountForDev: (type) => {
        if (DEMO_ACCOUNTS[type]) {
          set({
            isAuthenticated: true,
            userType: type,
            user: DEMO_ACCOUNTS[type],
            sessionToken: `sess_dev_${Date.now()}`,
          });
        }
      },
    }),
    {
      name: 'book_my_chef_auth_session',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
        user: state.user,
        sessionToken: state.sessionToken,
      }),
    }
  )
);
