import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, CheckCircle2, Lock } from 'lucide-react';

export const PolicyModal = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-theme-border bg-theme-surface shadow-2xl overflow-hidden transition-all z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-6 py-4.5 bg-theme-surface-subtle shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'terms'
                  ? 'bg-theme-brand text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-theme-brand text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 text-xs text-theme-secondary space-y-6 leading-relaxed">
          {activeTab === 'terms' ? (
            /* ======================================================== */
            /* REAL TERMS & CONDITIONS FOR PG FINDER PLATFORM          */
            /* ======================================================== */
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-theme-primary font-bold text-base mb-1">
                  <FileText className="h-4 w-4 text-theme-brand shrink-0" />
                  <h3>Terms & Conditions for PG Finder</h3>
                </div>
                <p className="text-[11px] text-theme-muted">
                  Effective Date: October 2026 &bull; Direct PG Marketplace Agreement
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>1. Direct Zero-Brokerage Marketplace</span>
                </h4>
                <p>
                  PG Finder is an accommodation marketplace designed to connect students and working professionals directly with Paying Guest (PG) property owners. PG Finder is not a broker, does not collect brokerage fees from tenants, and does not charge hidden commissions on listed properties.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>2. Property Listing Integrity & Owner Obligations</span>
                </h4>
                <p>
                  Property owners confirm that all submitted listing data—including monthly rent figures, room sharing types (Single, Double, Triple), meal plans, amenities, house rules, and security deposit amounts—is accurate and truthful.
                </p>
                <p>
                  Any accommodation listing found to contain misleading rent rates, fake room photographs, or deceptive availability will be rejected or permanently removed by platform administrators.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>3. Booking Requests & Rent Transparency</span>
                </h4>
                <p>
                  When a tenant submits a booking request, the request is sent directly to the property manager for verification and acceptance. Monthly rent rates, security deposit sums, and maintenance fees agreed upon at the time of booking confirmation cannot be unilaterally increased by the owner during the initial rental period.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>4. Notice Period & Security Deposit Return</span>
                </h4>
                <p>
                  Unless a specific property agreement stipulates an alternative timeline, PG Finder strongly encourages a standard 30-day notice period before vacating. Property owners must return the tenant security deposit (less documented utility dues or physical property damages) within 7 business days following move-out inspection.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>5. House Rules & Tenant Conduct</span>
                </h4>
                <p>
                  Tenants agree to abide by the specific house rules of the PG they join (including gate timings, visitor hours, silence hours, and common area cleanliness). Property managers retain the right to report or evict occupants who engage in unlawful activity, harassment, or property damage.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>6. Platform Disclaimers</span>
                </h4>
                <p>
                  While PG Finder verifies property listings and authenticates user accounts via phone and email verification, rental agreements and physical transactions are entered into directly between the tenant and the property owner.
                </p>
              </section>
            </div>
          ) : (
            /* ======================================================== */
            /* REAL PRIVACY POLICY FOR PG FINDER PLATFORM              */
            /* ======================================================== */
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-theme-primary font-bold text-base mb-1">
                  <Shield className="h-4 w-4 text-theme-brand shrink-0" />
                  <h3>Privacy Policy for PG Finder</h3>
                </div>
                <p className="text-[11px] text-theme-muted">
                  Last Updated: October 2026 &bull; Honest & Transparent Data Protection
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>1. Information We Collect</span>
                </h4>
                <p>
                  We collect only the essential information needed to operate your PG discovery and rental management experience:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li><strong>Account Registration:</strong> Name, email address, mobile number, and role (Tenant or PG Owner).</li>
                  <li><strong>Google / Firebase Authentication:</strong> If you use "Continue with Google", we receive your verified Google email and display name. We never access your Google password or private personal files.</li>
                  <li><strong>Owner Listings:</strong> Property address, area coordinates, room occupancy figures, rent pricing, and uploaded property images.</li>
                  <li><strong>In-App Messages:</strong> Direct communication between tenants and owners is stored securely so you have an official record of check-in and room inquiries.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>2. How Your Location Is Handled</span>
                </h4>
                <p>
                  When you click "Use my location", your browser or device coordinates are used solely in that moment to calculate distances to nearby accommodations and display PGs sorted nearest first. We do not track your location in the background, build physical movement logs, or sell your location to third-party data brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>3. Who Can See Your Contact Information</span>
                </h4>
                <p>
                  Your phone number and email address are never exposed publicly on the homepage or open search pages. Contact details are shared exclusively between a confirmed tenant and their respective PG manager once a booking request or direct chat is initiated, solely for check-in and tenancy coordination.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>4. Data Security & Storage Architecture</span>
                </h4>
                <p>
                  We implement robust industry-standard safeguards to protect your account:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li>Passwords are encrypted using one-way <code>bcrypt</code> hashing with 12 salt rounds.</li>
                  <li>User sessions are maintained via encrypted <code>httpOnly</code> cookies to prevent client-side JavaScript script injection (XSS) token theft.</li>
                  <li>Uploaded photos are stored securely on Cloudinary content distribution networks.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-theme-primary text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                  <span>5. Your Rights & Data Deletion</span>
                </h4>
                <p>
                  You retain complete ownership of your personal data. You may review your profile, modify your listed accommodations, or request full deletion of your account and associated records at any time by contacting our support team at <a href="mailto:support@pgfinder.local" className="text-theme-brand underline">support@pgfinder.local</a>.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-theme-border px-6 py-3.5 bg-theme-surface-subtle shrink-0 text-xs">
          <span className="text-[11px] text-theme-muted">
            Questions? Contact <a href="mailto:support@pgfinder.local" className="text-theme-brand underline">support@pgfinder.local</a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-theme-surface border border-theme-border px-4 py-1.5 font-semibold text-theme-primary hover:bg-theme-surface-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
