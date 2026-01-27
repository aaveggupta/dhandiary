export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-text selection:bg-primary/30 selection:text-white">
      {children}
    </div>
  );
}
