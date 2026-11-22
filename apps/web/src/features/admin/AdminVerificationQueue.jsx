import React, { useState } from 'react';
import { ASSETS } from '../../assets/assetCatalog';

export default function AdminVerificationQueue() {
  const [applications, setApplications] = useState([
    {
      id: 'prov-101',
      name: 'Chef Raghavendra Rao',
      brand: 'Royal Dakshin Culinary Studio',
      role: 'PRO_CHEF',
      experience: 18,
      phone: '+91 98490 12345',
      fssaiLicense: '13622011000492',
      fssaiDoc: 'fssai_cert_raghavendra.pdf',
      aadhaarDoc: 'aadhaar_masked_4921.pdf',
      status: 'PENDING_REVIEW',
      cuisines: ['Andhra Royal', 'Telangana Heritage'],
      avatar: ASSETS.chefRaghavendraStudio,
    },
    {
      id: 'prov-102',
      name: 'Chef Pradeep Varma',
      brand: 'Spice Route Kitchens',
      role: 'HOME_CHEF',
      experience: 12,
      phone: '+91 97000 54321',
      fssaiLicense: '13622011009812',
      fssaiDoc: 'fssai_cert_pradeep.pdf',
      aadhaarDoc: 'aadhaar_masked_1102.pdf',
      status: 'PENDING_REVIEW',
      cuisines: ['Telangana Country Curries'],
      avatar: ASSETS.chefFemaleMaharashtrian,
    },
  ]);

  const [selectedApp, setSelectedApp] = useState(applications[0]);
  const [successMsg, setSuccessMsg] = useState('');

  const approveApp = (id) => {
    setApplications(applications.filter(a => a.id !== id));
    setSuccessMsg('Provider successfully verified and published to marketplace!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const rejectApp = (id) => {
    setApplications(applications.filter(a => a.id !== id));
    setSuccessMsg('Application rejected. Feedback sent to provider.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#172033]">Provider KYC &amp; FSSAI Verification Queue</h1>
        <p className="font-sora text-xs text-[#64748B]">Audit food safety credentials, government IDs, and culinary experience before publishing.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#10B981]/15 border border-[#10B981] text-[#047857] font-sora text-xs font-bold animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications List */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
            Pending Applications ({applications.length})
          </span>

          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedApp?.id === app.id
                  ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/30 shadow-sm'
                  : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
                  <img src={app.avatar} alt={app.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-sora font-bold text-sm text-[#172033]">{app.name}</h4>
                  <p className="font-sora text-xs text-[#2196F3] font-semibold">{app.brand}</p>
                  <span className="text-[10px] font-sora text-[#64748B]">{app.experience} Yrs Exp • FSSAI Submitted</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#2196F3] text-[20px]">chevron_right</span>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] text-xs font-sora text-[#64748B]">
              All provider verification applications have been cleared!
            </div>
          )}
        </div>

        {/* Right Column: Detailed Document Inspection Card */}
        {selectedApp && (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <span className="text-[10px] font-sora font-bold text-[#0D47A1] uppercase tracking-wider">
                  KYC Dossier: {selectedApp.id}
                </span>
                <h3 className="font-sora font-extrabold text-lg text-[#172033] mt-0.5">{selectedApp.name}</h3>
                <p className="font-sora text-xs text-[#64748B]">{selectedApp.brand} • {selectedApp.phone}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-sora text-xs font-bold">
                Under Review
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sora">
              <div className="p-3.5 rounded-xl bg-[#f1f3ff]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">FSSAI License Number</span>
                <span className="font-bold text-[#172033] text-sm">{selectedApp.fssaiLicense}</span>
                <span className="text-[10px] text-[#10B981] block mt-1">✓ Verified with FSSAI Database</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f1f3ff]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Experience Claimed</span>
                <span className="font-bold text-[#172033] text-sm">{selectedApp.experience} Years Fine-Dining</span>
                <span className="text-[10px] text-[#2196F3] block mt-1">Ex-Taj Falaknuma</span>
              </div>
            </div>

            {/* Attached Documents Preview */}
            <div className="flex flex-col gap-2">
              <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
                Submitted Verification Documents
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs font-sora hover:bg-[#f1f3ff] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2196F3] text-[20px]">description</span>
                    <span className="font-semibold text-[#172033]">{selectedApp.fssaiDoc}</span>
                  </div>
                  <span className="text-[10px] text-[#2196F3] font-bold">Inspect</span>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs font-sora hover:bg-[#f1f3ff] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2196F3] text-[20px]">badge</span>
                    <span className="font-semibold text-[#172033]">{selectedApp.aadhaarDoc}</span>
                  </div>
                  <span className="text-[10px] text-[#2196F3] font-bold">Inspect</span>
                </div>
              </div>
            </div>

            {/* Actions: Approve & Reject */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                onClick={() => rejectApp(selectedApp.id)}
                className="px-5 py-2.5 bg-white border border-[#EF4444] text-[#EF4444] hover:bg-red-50 rounded-full font-sora text-xs font-bold transition-colors"
              >
                Reject Application
              </button>
              <button
                onClick={() => approveApp(selectedApp.id)}
                className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Approve &amp; Issue Atelier Badge</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
