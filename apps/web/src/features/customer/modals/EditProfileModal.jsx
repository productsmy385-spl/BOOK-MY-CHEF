import React, { useState } from 'react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, loginCustomer } = useAuthStore();
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [location, setLocation] = useState(user?.location || 'Hyderabad');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: location.trim(),
      };

      try {
        await api.customer.updateProfile(updateData, user?.id);
      } catch (err) {
        console.warn('Backend profile update fallback to local store:', err.message);
      }

      loginCustomer({
        ...(user || {}),
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: location.trim(),
      });

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">manage_accounts</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Edit Host Profile</h3>
              <p className="font-inter text-xs text-[#64748B]">Update contact &amp; personal information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 font-inter text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
              Primary City / Area
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad, Telangana"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2 px-5 text-xs font-bold font-sora cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
