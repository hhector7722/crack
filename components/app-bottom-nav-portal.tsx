'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { AppBottomNav } from './app-bottom-nav';

export function AppBottomNavPortal() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (pathname === '/login') return null;
  if (pathname.startsWith('/auth')) return null;

  return createPortal(<AppBottomNav />, document.body);
}
