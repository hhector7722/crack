'use client';

import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BottomChrome } from '@/components/bottom-chrome';
import { clearDocumentElementPullTransform } from '@/lib/layout/shell-pull-chrome';

/** Portal a body — TabBar fija al borde inferior (patrón trincadores). */
export function AppBottomNavPortal() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    clearDocumentElementPullTransform();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
