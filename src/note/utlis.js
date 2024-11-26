export function detectDevice() {
  const userAgent = navigator.userAgent
  // Check for mobile devices
  if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
    return 'mobile'
  }
  // Default to desktop if no mobile device is detected
  return 'Desktop'
}
