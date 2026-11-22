import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ASSETS } from '../assets/assetCatalog';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Clean Authentication State (Unauthenticated by default)
      userType: null, // 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | null
      isAuthenticated: false,
      user: null,
      sessionToken: null,

      // 1. Customer Authentication Actions
      loginCustomer: ({ id, identifier, phone, email, name, location, clerkId, sessionToken }) => {
        const resolvedPhone = phone || (identifier && (identifier.startsWith('+') || /^\d+$/.test(identifier)) ? identifier : '');
        const resolvedEmail = email || (identifier && identifier.includes('@') ? identifier : '');
        const user = {
          id: id || `usr_cust_${Date.now()}`,
          name: name || 'Customer',
          phone: resolvedPhone,
          email: resolvedEmail,
          location: location || '',
          accountType: 'CUSTOMER',
          clerkId: clerkId || '',
          avatar: ASSETS.userAvatar,
        };
        set({
          isAuthenticated: true,
          userType: 'CUSTOMER',
          user,
          sessionToken: sessionToken || `sess_cust_${Date.now()}`,
        });
        return user;
      },

      registerCustomer: ({ id, fullName, mobileNumber, email, location, clerkId, sessionToken }) => {
        const user = {
          id: id || `usr_cust_${Date.now()}`,
          name: fullName || 'Customer',
          phone: mobileNumber,
          email: email || '',
          location: location || '',
          accountType: 'CUSTOMER',
          clerkId: clerkId || '',
          avatar: ASSETS.userAvatar,
        };
        set({
          isAuthenticated: true,
          userType: 'CUSTOMER',
          user,
          sessionToken: sessionToken || `sess_cust_${Date.now()}`,
        });
        return user;
      },

      // 2. Service Partner Authentication Actions
      loginPartner: ({ id, identifier, phone, email, name, businessName, location, roles, clerkId, sessionToken }) => {
        const resolvedPhone = phone || (identifier && (identifier.startsWith('+') || /^\d+$/.test(identifier)) ? identifier : '');
        const resolvedEmail = email || (identifier && identifier.includes('@') ? identifier : '');
        const user = {
          id: id || `usr_prov_${Date.now()}`,
          name: name || 'Service Partner',
          phone: resolvedPhone,
          email: resolvedEmail,
          businessName: businessName || '',
          location: location || '',
          accountType: 'PROVIDER',
          roles: roles && roles.length > 0 ? roles : ['PRO_CHEF'],
          clerkId: clerkId || '',
          avatar: ASSETS.chefRaghavendraStudio,
        };
        set({
          isAuthenticated: true,
          userType: 'PROVIDER',
          user,
          sessionToken: sessionToken || `sess_prov_${Date.now()}`,
        });
        return user;
      },

      registerPartner: ({ id, fullName, mobileNumber, email, businessName, location, roles, clerkId, sessionToken }) => {
        const user = {
          id: id || `usr_prov_${Date.now()}`,
          name: fullName || 'Service Partner',
          phone: mobileNumber,
          email: email || '',
          businessName: businessName || `${fullName || 'Partner'}'s Culinary Atelier`,
          location: location || '',
          accountType: 'PROVIDER',
          roles: roles && roles.length > 0 ? roles : ['PRO_CHEF'],
          clerkId: clerkId || '',
          avatar: ASSETS.chefRaghavendraStudio,
        };
        set({
          isAuthenticated: true,
          userType: 'PROVIDER',
          user,
          sessionToken: sessionToken || `sess_prov_${Date.now()}`,
        });
        return user;
      },

      // 3. Platform Administrator Authentication Actions
      loginAdmin: ({ id, email, phone, name, adminRole, clerkId, sessionToken }) => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const user = {
          id: id || `usr_admin_${Date.now()}`,
          name: name || 'Administrator',
          phone: phone || '',
          email: normalizedEmail,
          location: 'Platform Operations HQ',
          accountType: 'ADMIN',
          adminRole: adminRole || 'ADMIN',
          clerkId: clerkId || '',
          avatar: ASSETS.userAvatar,
        };

        set({
          isAuthenticated: true,
          userType: 'ADMIN',
          user,
          sessionToken: sessionToken || `sess_admin_${Date.now()}`,
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
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('book_my_chef_auth_session');
            localStorage.removeItem('bmc_clerk_token');
            sessionStorage.clear();
            if (window.Clerk && typeof window.Clerk.signOut === 'function') {
              window.Clerk.signOut().catch((e) => console.warn('Global Clerk signOut warning:', e));
            }
          }
        } catch (e) {
          // ignore
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
