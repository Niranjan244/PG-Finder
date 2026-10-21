import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Shield, FileText } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { PolicyModal } from './PolicyModal.jsx';

export const Footer = () => {
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState('terms');

  const openPolicyModal = (tab) => {
    setPolicyModalTab(tab);
    setIsPolicyModalOpen(true);
  };

  return (
    <>
      <footer id="contact" className="bg-theme-surface border-t border-theme-border transition-colors">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Info */}
            <div className="md:col-span-5 space-y-3.5">
              <Link to="/" className="flex items-center gap-2 text-theme-primary">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="text-base font-bold tracking-tight">PG Finder</span>
              </Link>

              <p className="text-xs text-theme-secondary max-w-sm leading-relaxed">
                The modern platform for discovering, inspecting, and booking verified Paying Guest accommodations with live bed availability and zero broker fees.
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs text-theme-muted">
                <Mail className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                <span>Contact: <a href="mailto:support@pgfinder.local" className="hover:text-theme-brand underline">support@pgfinder.local</a></span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-primary">
                Discover
              </h4>
              <ul className="space-y-2.5 text-xs text-theme-secondary">
                <li>
                  <Link to="/login" className="hover:text-theme-brand transition-colors">
                    Search PGs
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-theme-brand transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#for-owners" className="hover:text-theme-brand transition-colors">
                    For Owners
                  </a>
                </li>
              </ul>
            </div>

            {/* Account & Owners */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-primary">
                Portals
              </h4>
              <ul className="space-y-2.5 text-xs text-theme-secondary">
                <li>
                  <Link to="/login" className="hover:text-theme-brand transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-theme-brand transition-colors">
                    Tenant Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/register?role=owner" className="hover:text-theme-brand transition-colors">
                    Owner Registration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Real Terms & Privacy Policies */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-primary">
                Legal & Safety
              </h4>
              <ul className="space-y-2.5 text-xs text-theme-secondary">
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="hover:text-theme-brand transition-colors text-left flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                    <span>Terms & Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="hover:text-theme-brand transition-colors text-left flex items-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5 text-theme-brand shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="text-[11px] text-theme-muted hover:text-theme-primary transition-colors text-left"
                  >
                    Zero Brokerage & Listing Guidelines
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="text-[11px] text-theme-muted hover:text-theme-primary transition-colors text-left"
                  >
                    Data Encryption & Location Safety
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Sub-footer */}
          <div className="mt-12 pt-6 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-theme-muted">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>© {new Date().getFullYear()} PG Finder Platform. All rights reserved.</span>
              <span className="hidden sm:inline text-theme-border">&bull;</span>
              <button
                type="button"
                onClick={() => openPolicyModal('terms')}
                className="hover:text-theme-primary transition-colors underline"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => openPolicyModal('privacy')}
                className="hover:text-theme-primary transition-colors underline"
              >
                Privacy
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px]">Direct PG Rental Network</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>

      {/* Real Terms & Conditions / Privacy Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        initialTab={policyModalTab}
      />
    </>
  );
};

export default Footer;
