import { useState } from "react";
import {
  Baby,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  CreditCard,
  Heart,
  History,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type DashboardHeaderProps = {
  profileName: string;
  unreadNotifications: number;
  onMarkNotificationsRead: () => void;
  onSignOut: () => void;
  onOpenSettings: (section?: string) => void;
  onEditProfile: () => void;
};

const DashboardHeader = ({
  profileName,
  unreadNotifications,
  onMarkNotificationsRead,
  onSignOut,
  onOpenSettings,
  onEditProfile,
}: DashboardHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#e5eeea] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Little Steps dashboard home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
            <Heart size={22} strokeWidth={2.5} />
          </span>
          <span className="font-sans text-xl font-extrabold tracking-tight text-[#26384b]">
            Little <span className="text-[#278a70]">Steps</span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm font-medium xl:flex">
          <a href="#discover" className="font-semibold text-[#278a70]">Explore</a>
          <button type="button" onClick={() => onOpenSettings()} className="text-[#526777] transition hover:text-[#278a70]">Settings</button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="relative rounded-xl border border-[#d8e6e0] p-2.5 text-[#526777] transition hover:bg-[#f6f9f7]"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={`Notifications, ${unreadNotifications} unread`}
              aria-expanded={notificationsOpen}
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-[#e3ece7] bg-white p-4 text-[#26384b] shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Notifications</h2>
                  <span className="text-xs text-[#778691]">{unreadNotifications} unread</span>
                </div>
                <ul className="mt-3 space-y-3 text-sm text-[#687a88]">
                  <li className="flex items-start gap-2">
                    <CalendarDays size={16} className="mt-0.5 shrink-0 text-[#278a70]" />
                    Your childcare dashboard is ready to explore.
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart size={16} className="mt-0.5 shrink-0 text-[#278a70]" />
                    Save centers to compare them later.
                  </li>
                  <li className="flex items-start gap-2">
                    <Baby size={16} className="mt-0.5 shrink-0 text-[#278a70]" />
                    Check center details before requesting a booking.
                  </li>
                </ul>
                {unreadNotifications > 0 && (
                  <button
                    className="mt-4 w-full rounded-lg bg-[#e5f4ee] px-3 py-2 text-sm font-semibold text-[#237960] transition hover:bg-[#d7eee4]"
                    onClick={() => {
                      onMarkNotificationsRead();
                      setNotificationsOpen(false);
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8e6e0] px-3 text-sm font-semibold text-[#526777] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            aria-label="Sign out of parent account"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Sign out</span>
          </button>

          <div className="relative hidden sm:block">
            <button
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#f6f9f7]"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3f3ed] font-bold text-[#278a70]">
                {profileName.trim().charAt(0).toUpperCase() || "P"}
              </span>
              <span className="max-w-28 truncate text-sm font-semibold text-[#26384b]">{profileName}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 z-40 w-48 rounded-xl border border-[#e3ece7] bg-white p-2 shadow-xl">
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#526777] hover:bg-[#f6f9f7] hover:text-[#278a70]"
                  onClick={() => {
                    setProfileOpen(false);
                    onEditProfile();
                  }}
                >
                  Edit profile
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#526777] hover:bg-[#f6f9f7] hover:text-[#278a70]"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenSettings();
                  }}
                >
                  Settings &amp; history
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#526777] hover:bg-[#f6f9f7] hover:text-[#278a70]"
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-[#526777] hover:bg-[#f6f9f7] xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Dashboard menu"
          className="max-h-[calc(100svh-72px)] overflow-y-auto border-t border-[#e5eeea] bg-[#f8faf9] px-4 py-4 text-[#526777] shadow-lg xl:hidden"
        >
          <div className="mx-auto max-w-xl space-y-1">
            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-[#81929b]">
              Discover
            </p>
            <a
              href="#discover"
              onClick={closeMenu}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition hover:bg-white hover:text-[#278a70]"
            >
              <Heart size={17} className="shrink-0 text-[#278a70]" />
              <span className="min-w-0 flex-1">Explore daycare</span>
              <ChevronRight size={16} className="shrink-0 text-[#a2b0b7]" />
            </a>

            <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-[#81929b]">
              Family activity
            </p>
            {[
              { label: "Booking history", section: "bookings", Icon: History },
              { label: "Payment history & refunds", section: "payments", Icon: CreditCard },
              { label: "Camera access", section: "camera-access", Icon: Camera },
              { label: "Caregiver recommendations", section: "caregivers", Icon: Sparkles },
              { label: "Subscription", section: "subscription", Icon: CalendarDays },
            ].map(({ label, section, Icon }) => (
              <button
                key={section}
                type="button"
                onClick={() => {
                  closeMenu();
                  onOpenSettings(section);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-white hover:text-[#278a70]"
              >
                <Icon size={17} className="shrink-0 text-[#278a70]" />
                <span className="min-w-0 flex-1 break-words">{label}</span>
                <ChevronRight size={16} className="shrink-0 text-[#a2b0b7]" />
              </button>
            ))}

            <div className="my-3 border-t border-[#e3ece7]" />
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenSettings();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-white hover:text-[#278a70]"
            >
              <Settings size={17} className="shrink-0 text-[#278a70]" />
              <span className="min-w-0 flex-1">Settings &amp; history</span>
              <ChevronRight size={16} className="shrink-0 text-[#a2b0b7]" />
            </button>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onEditProfile();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-white hover:text-[#278a70]"
            >
              <UserRound size={17} className="shrink-0 text-[#278a70]" />
              <span className="min-w-0 flex-1">Edit profile</span>
              <ChevronRight size={16} className="shrink-0 text-[#a2b0b7]" />
            </button>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onSignOut();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-[#9b4d4d] transition hover:bg-white"
            >
              <LogOut size={17} className="shrink-0" />
              <span className="min-w-0 flex-1">Sign out</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default DashboardHeader;
