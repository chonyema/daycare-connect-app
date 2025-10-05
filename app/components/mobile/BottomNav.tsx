'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  CalendarIcon as CalendarIconSolid,
  UserIcon as UserIconSolid,
  Cog6ToothIcon as SettingsIconSolid,
} from '@heroicons/react/24/solid';
import { cn, hapticFeedback } from '@/app/lib/utils';
import { useAuth } from '@/app/contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Define navigation items based on user role
  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      iconActive: HomeIconSolid,
    },
    {
      name: 'Search',
      href: '/search',
      icon: MagnifyingGlassIcon,
      iconActive: SearchIconSolid,
    },
    {
      name: 'Bookings',
      href: user?.userType === 'PARENT' ? '/parent/bookings' : '/provider',
      icon: CalendarIcon,
      iconActive: CalendarIconSolid,
    },
    {
      name: 'Profile',
      href: user?.userType === 'PARENT' ? '/parent/profile' : '/provider/profile',
      icon: UserIcon,
      iconActive: UserIconSolid,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      iconActive: SettingsIconSolid,
    },
  ];

  const handleNavClick = (href: string) => {
    hapticFeedback('light');
    router.push(href);
  };

  // Don't show bottom nav on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = isActive ? item.iconActive : item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 relative transition-colors',
                'active:bg-gray-100 touch-manipulation',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon with scale animation */}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>

              {/* Label */}
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>

              {/* Badge for notifications (example) */}
              {item.name === 'Bookings' && (
                <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
