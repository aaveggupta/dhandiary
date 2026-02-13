'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { useSettings } from '@/hooks';
import {
  User,
  Moon,
  Bell,
  LogOut,
  ChevronRight,
  HelpCircle,
  Smartphone,
  CreditCard,
  LayoutGrid,
  Globe,
  Lock,
  Tags,
} from 'lucide-react';
import Image from 'next/image';

const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="mb-6 mt-8 flex items-start gap-4 md:mt-0">
    <div className="rounded-xl border border-slate-800 bg-surfaceHighlight p-3 text-primary">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  </div>
);

const SettingsItem = ({
  icon,
  label,
  subLabel,
  href,
  onClick,
  color = 'text-text',
  rightElement,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  href?: string;
  onClick?: () => void;
  color?: string;
  rightElement?: React.ReactNode;
}) => {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="text-muted transition-colors group-hover:text-primary">{icon}</div>
        <div className="text-left">
          <span className={`block font-medium ${color}`}>{label}</span>
          {subLabel && <span className="text-xs text-muted">{subLabel}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <ChevronRight size={16} className="text-slate-600" />
      </div>
    </>
  );
  const className =
    'group flex w-full items-center justify-between border-b border-border bg-surface/30 p-4 backdrop-blur-sm transition-colors first:rounded-t-xl last:rounded-b-xl last:border-0 hover:bg-surfaceHighlight/50';
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
};

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: settings } = useSettings();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut({ redirectUrl: '/sign-in' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl animate-fade-in pb-24">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted">Manage your preferences and account details.</p>
        </div>
      </div>

      {/* Grid Layout for Desktop */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Profile */}
        <div className="space-y-6 md:col-span-1">
          <Card className="relative overflow-hidden p-6 text-center">
            <div className="absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-primary/10 to-transparent" />

            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface shadow-xl">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.firstName || 'User'}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="gradient-primary flex h-full w-full items-center justify-center rounded-full text-3xl font-bold text-white">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="mb-4 text-sm text-muted">{user?.emailAddresses?.[0]?.emailAddress}</p>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-500">
                Free Plan
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="rounded-xl border border-border bg-surfaceHighlight p-3">
                  <p className="text-xs text-muted">Currency</p>
                  <p className="font-bold">{settings?.currency || 'USD'}</p>
                </div>
                <div className="rounded-xl border border-border bg-surfaceHighlight p-3">
                  <p className="text-xs text-muted">Status</p>
                  <p className="font-bold text-emerald-400">Active</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-1">
            <button
              className="flex w-full items-center gap-3 rounded-xl p-4 font-medium text-red-400 transition-colors hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </Card>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="space-y-8 md:col-span-2">
          {/* Account Section */}
          <section>
            <SectionHeader
              icon={<User size={20} />}
              title="Account"
              description="Personal information and security."
            />
            <div className="overflow-hidden rounded-xl border border-border">
              <SettingsItem
                icon={<User size={18} />}
                label="Personal Details"
                subLabel="Name, Email"
              />
              <SettingsItem
                icon={<Lock size={18} />}
                label="Security"
                subLabel="2FA, Password"
                rightElement={<Badge variant="success">Secure</Badge>}
              />
              <SettingsItem
                icon={<CreditCard size={18} />}
                label="Subscription"
                subLabel="Manage billing"
              />
            </div>
          </section>

          {/* App Settings */}
          <section>
            <SectionHeader
              icon={<LayoutGrid size={20} />}
              title="App Preferences"
              description="Customize your experience."
            />
            <div className="overflow-hidden rounded-xl border border-border">
              <SettingsItem
                icon={<Bell size={18} />}
                label="Notifications"
                subLabel="Push, Email"
                rightElement={<span className="text-xs text-muted">On</span>}
              />
              <SettingsItem icon={<Globe size={18} />} label="Language" subLabel="English (US)" />
              <SettingsItem icon={<Moon size={18} />} label="Theme" subLabel="Dark Mode" />
            </div>
          </section>

          {/* Categories */}
          <section>
            <SectionHeader
              icon={<Tags size={20} />}
              title="Categories"
              description="Manage your transaction categories."
            />
            <div className="overflow-hidden rounded-xl border border-border">
              <SettingsItem
                href="/settings/categories"
                icon={<Tags size={18} />}
                label="Categories"
                subLabel="Add, edit, or remove transaction categories"
              />
            </div>
          </section>

          {/* Support */}
          <section>
            <SectionHeader
              icon={<HelpCircle size={20} />}
              title="Support"
              description="Get help with DhanDiary."
            />
            <div className="overflow-hidden rounded-xl border border-border">
              <SettingsItem icon={<HelpCircle size={18} />} label="Help Center" />
              <SettingsItem
                icon={<Smartphone size={18} />}
                label="App Version"
                rightElement={<span className="text-xs text-muted">v1.0.0</span>}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
