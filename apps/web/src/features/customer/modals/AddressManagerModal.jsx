import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function AddressManagerModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [tag, setTag] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [areaLandmark, setAreaLandmark] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const initialSeedAddresses = [
    {
      id: 'addr-default-1',
      tag: 'Home',
      addressLine1: 'Plot 42, Road No. 36, Jubilee Hills',
      areaLandmark: 'Near Peddamma Temple',
      city: 'Hyderabad',
      postalCode: '500033',
      isDefault: true,
    },
    {
      id: 'addr-default-2',
      tag: 'Event Villa',
      addressLine1: 'Villa 18, Palm Meadows, Gandipet',
      areaLandmark: 'Opposite Ocean Park',
      city: 'Hyderabad',
      postalCode: '500075',
      isDefault: false,
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadAddresses() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await api.customer.getAddresses(user?.id);
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setAddresses(res.data);
        } else {
          // Check localStorage cache
          const local = localStorage.getItem(`bmc_addresses_${user?.id || 'guest'}`);
          if (local) {
            setAddresses(JSON.parse(local));
          } else {
            setAddresses(initialSeedAddresses);
          }
        }
      } catch (err) {
        console.warn('Could not fetch addresses from backend, using local storage:', err);
        const local = localStorage.getItem(`bmc_addresses_${user?.id || 'guest'}`);
        if (local) {
          setAddresses(JSON.parse(local));
        } else {
          setAddresses(initialSeedAddresses);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAddresses();
    return () => { isMounted = false; };
  }, [isOpen, user?.id]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete Address Line, City, and 6-digit PIN code.');
      return;
    }

    const newAddr = {
      id: `addr-${Date.now()}`,
      tag,
      addressLine1: addressLine1.trim(),
      areaLandmark: areaLandmark.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      isDefault,
    };

    try {
      await api.customer.addAddress(newAddr, user?.id);
    } catch (err) {
      console.warn('Backend address save skipped, saving locally:', err.message);
    }

    const updated = isDefault
      ? addresses.map(a => ({ ...a, isDefault: false })).concat(newAddr)
      : [...addresses, newAddr];

    setAddresses(updated);
    localStorage.setItem(`bmc_addresses_${user?.id || 'guest'}`, JSON.stringify(updated));

    setSuccessMsg('Address added successfully!');
    setIsAdding(false);
    setAddressLine1('');
    setAreaLandmark('');
    setPostalCode('');
    setIsDefault(false);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await api.customer.deleteAddress(addressId, user?.id);
    } catch (err) {
      console.warn('Backend address delete skipped, updating locally:', err.message);
    }
    const updated = addresses.filter(a => a.id !== addressId);
    setAddresses(updated);
    localStorage.setItem(`bmc_addresses_${user?.id || 'guest'}`, JSON.stringify(updated));
  };

  const handleSetDefault = (addressId) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    setAddresses(updated);
    localStorage.setItem(`bmc_addresses_${user?.id || 'guest'}`, JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">home_pin</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Saved Addresses</h3>
              <p className="font-inter text-xs text-[#64748B]">Manage delivery &amp; event venue locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md font-inter flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-inter flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* List Saved Addresses */}
          {!isAdding && (
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-md border transition-all ${
                    addr.isDefault
                      ? 'border-[#2196F3] bg-[#E3F2FD]/30 shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9]/40">
                        {addr.tag || 'Location'}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[11px] font-medium text-[#2196F3] hover:underline px-1.5 cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Delete Address"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="font-sora text-xs font-bold text-[#172033] mt-2">
                    {addr.addressLine1}
                  </p>
                  {addr.areaLandmark && (
                    <p className="font-inter text-xs text-[#64748B] mt-0.5">
                      {addr.areaLandmark}
                    </p>
                  )}
                  <p className="font-inter text-xs text-[#64748B] mt-0.5">
                    {addr.city} • PIN: {addr.postalCode}
                  </p>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="mt-2 py-2.5 px-4 rounded-md border-2 border-dashed border-[#2196F3] text-[#0D47A1] hover:bg-[#E3F2FD]/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                <span>Add New Address</span>
              </button>
            </div>
          )}

          {/* Form to Add New Address */}
          {isAdding && (
            <form onSubmit={handleSaveAddress} className="flex flex-col gap-3 font-inter text-xs">
              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Address Tag
                </label>
                <div className="flex gap-2">
                  {['Home', 'Event Villa', 'Banquet Hall', 'Office'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`py-1.5 px-3 rounded font-medium text-xs border transition-colors cursor-pointer ${
                        tag === t
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                          : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#90CAF9]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  House / Flat / Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 42, Road 36, Jubilee Hills"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Area / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Peddamma Temple"
                  value={areaLandmark}
                  onChange={(e) => setAreaLandmark(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 500033"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2196F3] focus:ring-[#2196F3]"
                />
                <span className="text-xs text-[#172033]">Set as default address for bookings</span>
              </label>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-1.5 px-4 text-xs font-bold font-sora cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-[#CBD5E1] text-xs font-semibold text-[#172033] hover:bg-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
