import { useEffect, useRef, useCallback } from 'react';

type UseRfidScannerOptions = {
    /** Called when a complete badge scan is detected */
    onScan: (badgeNumber: string) => void;
    /** Whether the scanner is actively listening (default: true) */
    enabled?: boolean;
    /** Max ms between keystrokes to count as part of a scan (default: 80) */
    maxKeystrokeGap?: number;
    /** Minimum characters for a valid badge read (default: 6) */
    minLength?: number;
};

/**
 * Hook that listens for USB RFID reader input.
 *
 * USB HID RFID readers (like the EM4100 125KHz reader) emulate a keyboard:
 * they "type" the card number as rapid keystrokes and press Enter at the end.
 *
 * This hook distinguishes RFID input from normal typing by checking:
 * 1. Keystrokes arrive much faster than human typing (< 80ms apart)
 * 2. The sequence ends with Enter
 * 3. The result is long enough to be a badge number (>= 6 digits)
 *
 * The hook captures and suppresses RFID input so it doesn't
 * accidentally fill form fields.
 */
export function useRfidScanner({
                                   onScan,
                                   enabled = true,
                                   maxKeystrokeGap = 80,
                                   minLength = 6,
                               }: UseRfidScannerOptions) {
    const bufferRef = useRef('');
    const lastKeystrokeRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onScanRef = useRef(onScan);

    // Keep callback ref fresh without re-attaching listeners
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    const resetBuffer = useCallback(() => {
        bufferRef.current = '';
        lastKeystrokeRef.current = 0;
    }, []);

    useEffect(() => {
        if (!enabled) {
            resetBuffer();
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const gap = now - lastKeystrokeRef.current;

            // If there's been a long pause, this is a new sequence
            if (gap > maxKeystrokeGap && bufferRef.current.length > 0) {
                resetBuffer();
            }

            // Enter key = end of scan
            if (e.key === 'Enter') {
                const scanned = bufferRef.current.trim();
                if (scanned.length >= minLength) {
                    // This looks like an RFID scan — suppress the Enter
                    // and fire the callback
                    e.preventDefault();
                    e.stopPropagation();
                    const badge = scanned;
                    resetBuffer();
                    onScanRef.current(badge);
                    return;
                }
                // Too short — probably normal user pressing Enter
                resetBuffer();
                return;
            }

            // Only buffer printable single characters (digits, letters)
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // If this is a rapid keystroke, it's likely from the reader
                if (bufferRef.current.length === 0 || gap <= maxKeystrokeGap) {
                    bufferRef.current += e.key;
                    lastKeystrokeRef.current = now;

                    // If we're mid-scan (buffer growing fast), suppress
                    // the character so it doesn't fill focused inputs
                    if (bufferRef.current.length >= 3) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    // Safety timeout: if no more keys come, clear the buffer
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(resetBuffer, maxKeystrokeGap * 3);
                }
            }
        };

        // Use capture phase so we intercept before form inputs see the events
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [enabled, maxKeystrokeGap, minLength, resetBuffer]);
}