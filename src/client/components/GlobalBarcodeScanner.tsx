'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function GlobalBarcodeScanner() {
  const router = useRouter();
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is too long (>50ms), it's probably a human typing, not a scanner.
      // Reset the buffer.
      if (currentTime - lastKeyTime.current > 50) {
        buffer.current = '';
      }
      
      lastKeyTime.current = currentTime;

      // When the scanner hits Enter, process the barcode
      if (e.key === 'Enter' && buffer.current.length > 5) {
        const barcode = buffer.current;
        buffer.current = '';
        
        // Assume the barcode is the Patient ID. Route to their unified profile.
        // We will just push to the route. If it fails (404), the page will show not found.
        router.push(`/dashboard/patient/${barcode}`);
        return;
      }

      // Add to buffer (only single characters to avoid capturing special keys)
      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null; // Invisible global listener
}
