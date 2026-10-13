const OPEN_EMERGENCY_MODAL_EVENT = 'saudememora:open-emergency-modal';

export function triggerEmergencyModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_EMERGENCY_MODAL_EVENT));
  }
}

export function subscribeToEmergencyModal(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(OPEN_EMERGENCY_MODAL_EVENT, callback);
  return () => window.removeEventListener(OPEN_EMERGENCY_MODAL_EVENT, callback);
}
