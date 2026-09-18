// Обертка над MAX Bridge с fallback для разработки в браузере
export const maxBridge = {
  isAvailable: () => typeof window !== 'undefined' && !!window.MAXWebApp,

  init: () => {
    if (maxBridge.isAvailable()) {
      try {
        window.MAXWebApp.ready();
        window.MAXWebApp.expand();
        return true;
      } catch (e) {
        console.warn('MAX Bridge init failed', e);
      }
    }
    return false;
  },

  getUser: () => {
    if (maxBridge.isAvailable()) {
      return window.MAXWebApp.initDataUnsafe?.user || null;
    }
    return null;
  },

  sendData: (data) => {
    if (maxBridge.isAvailable() && window.MAXWebApp.sendData) {
      window.MAXWebApp.sendData(JSON.stringify(data));
    } else {
      console.log('[MAX Bridge] sendData:', data);
    }
  },

  haptic: (type = 'light') => {
    if (maxBridge.isAvailable() && window.MAXWebApp.HapticFeedback) {
      try {
        window.MAXWebApp.HapticFeedback.impactOccurred(type);
      } catch (e) {
        // ignore
      }
    }
  },

  showAlert: (msg) => {
    if (maxBridge.isAvailable() && window.MAXWebApp.showAlert) {
      window.MAXWebApp.showAlert(msg);
    } else {
      alert(msg);
    }
  }
};