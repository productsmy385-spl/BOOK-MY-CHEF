import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

const INITIAL_SERVICES = [
  {
    id: 'svc-1',
    title: 'Chef Visits Home (Live Feast)',
    desc: 'Chef cooks on-site in customer kitchen using traditional brass and copper vessels.',
    pricingModel: 'PER_PERSON',
    basePrice: 1500,
    perPersonRate: 350,
    price: '₹1,500 base + ₹350/guest',
    category: 'HOME_CHEF',
    active: true,
  },
  {
    id: 'svc-2',
    title: 'Cook & Deliver Banquet',
    desc: 'Prepared in studio kitchen, delivered in hot thermal packs with fresh banana leaves.',
    pricingModel: 'PER_PERSON',
    basePrice: 0,
    perPersonRate: 400,
    price: '₹400/guest (Min 15 guests)',
    category: 'CATERING',
    active: true,
  },
  {
    id: 'svc-3',
    title: 'Royal Andhra 5-Course Package',
    desc: 'Signature multi-course feast with Gutti Vankaya, Mango Pappu, and fresh Bobbatlu.',
    pricingModel: 'PER_PERSON',
    basePrice: 0,
    perPersonRate: 1499,
    price: '₹1,499/guest',
    category: 'PRO_CHEF',
    active: true,
  },
];

export default function ProviderServices() {
  const { user } = useAuthStore();
  const storageKey = `bmc_provider_services_${user?.id || 'default'}`;

  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch (e) {
      return INITIAL_SERVICES;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('PRO_CHEF');
  const [pricingModel, setPricingModel] = useState('PER_PERSON');
  const [basePrice, setBasePrice] = useState('1500');
  const [perPersonRate, setPerPersonRate] = useState('350');
  const [active, setActive] = useState(true);

  const saveToStorage = (updated) => {
    setServices(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist services to localStorage:', e);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingServiceId(null);
    setTitle('');
    setDesc('');
    setCategory('PRO_CHEF');
    setPricingModel('PER_PERSON');
    setBasePrice('1500');
    setPerPersonRate('350');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (svc) => {
    setModalMode('EDIT');
    setEditingServiceId(svc.id);
    setTitle(svc.title);
    setDesc(svc.desc);
    setCategory(svc.category || 'PRO_CHEF');
    setPricingModel(svc.pricingModel || 'PER_PERSON');
    setBasePrice(String(svc.basePrice || 0));
    setPerPersonRate(String(svc.perPersonRate || 0));
    setActive(svc.active);
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let displayPrice = '';
    const bPrice = Number(basePrice) || 0;
    const pRate = Number(perPersonRate) || 0;

    if (pricingModel === 'PER_PERSON') {
      displayPrice = bPrice > 0 ? `₹${bPrice.toLocaleString('en-IN')} base + ₹${pRate}/guest` : `₹${pRate.toLocaleString('en-IN')}/guest`;
    } else if (pricingModel === 'PER_PLATE') {
      displayPrice = `₹${pRate.toLocaleString('en-IN')}/plate`;
    } else {
      displayPrice = `₹${bPrice.toLocaleString('en-IN')}/event`;
    }

    if (modalMode === 'CREATE') {
      const newSvc = {
        id: `svc-${Date.now()}`,
        title: title.trim(),
        desc: desc.trim(),
        category,
        pricingModel,
        basePrice: bPrice,
        perPersonRate: pRate,
        price: displayPrice,
        active,
      };
      saveToStorage([...services, newSvc]);
    } else {
      const updated = services.map((s) => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            title: title.trim(),
            desc: desc.trim(),
            category,
            pricingModel,
            basePrice: bPrice,
            perPersonRate: pRate,
            price: displayPrice,
            active,
          };
        }
        return s;
      });
      saveToStorage(updated);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id) => {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    saveToStorage(updated);
  };

  const handleDeleteService = (id) => {
    if (window.confirm('Are you sure you want to delete this service listing?')) {
      const updated = services.filter(s => s.id !== id);
      saveToStorage(updated);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-lg text-[#172033]">Services &amp; Packages</h2>
          <p className="text-xs text-[#64748B]">Manage your active culinary listings &amp; rates</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Service</span>
        </button>
      </div>

      {/* Services List */}
      <div className="mt-4 flex flex-col gap-3">
        {services.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#CBD5E1] rounded-lg text-[#64748B] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#90CAF9]">restaurant_menu</span>
            <p className="text-xs font-semibold">No services created yet.</p>
            <button
              onClick={openCreateModal}
              className="btn-primary py-1.5 px-4 text-xs font-bold mt-1"
            >
              Add First Service
            </button>
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className={`p-4 rounded-lg bg-white border shadow-xs flex flex-col gap-2 transition-all ${
                svc.active ? 'border-[#E5E7EB]' : 'border-[#CBD5E1] opacity-70 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="font-bold text-sm text-[#172033] truncate">{svc.title}</h4>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E3F2FD] text-[#0D47A1]">
                    {svc.category || 'CHEF'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(svc.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    svc.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {svc.active ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>

              <p className="font-inter text-xs text-[#64748B] leading-relaxed">{svc.desc}</p>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E7EB] text-xs font-inter">
                <span className="font-extrabold text-[#0D47A1] font-sora">{svc.price}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(svc)}
                    className="text-[#2196F3] font-bold hover:underline cursor-pointer flex items-center gap-0.5 text-xs font-sora"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Edit Rates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(svc.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-Place Create/Edit Service Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2196F3] text-[22px]">room_service</span>
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">
                    {modalMode === 'CREATE' ? 'Add Service Package' : 'Edit Service Package'}
                  </h3>
                  <p className="font-inter text-xs text-[#64748B]">Set title, pricing model &amp; guest rates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 overflow-y-auto flex flex-col gap-3.5 font-inter text-xs">
              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Andhra 5-Course Live Banquet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Service Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] outline-none bg-white"
                >
                  <option value="HOME_CHEF">Home Chef</option>
                  <option value="PRO_CHEF">Professional Chef</option>
                  <option value="CATERING">Catering / Banquet</option>
                  <option value="PLANNER">Event Planner</option>
                  <option value="DECOR">Decoration &amp; Styling</option>
                  <option value="BARTENDER">Bartender / Mixologist</option>
                </select>
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Description &amp; Deliverables *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe dishes, cookware provided, and what is included..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Pricing Model
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PER_PERSON', label: 'Per Person' },
                    { id: 'PER_PLATE', label: 'Per Plate' },
                    { id: 'PER_EVENT', label: 'Per Event' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPricingModel(m.id)}
                      className={`py-1.5 px-2 rounded-md border text-center text-xs font-medium cursor-pointer transition-colors ${
                        pricingModel === m.id
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] font-bold'
                          : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#90CAF9]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                    Base Visiting Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                    Rate per Guest/Item (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={perPersonRate}
                    onChange={(e) => setPerPersonRate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2196F3] focus:ring-[#2196F3]"
                />
                <span className="text-xs text-[#172033] font-medium">List as immediately bookable by hosts</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB] mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs font-bold font-sora cursor-pointer"
                >
                  {modalMode === 'CREATE' ? 'Add Package' : 'Save Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
