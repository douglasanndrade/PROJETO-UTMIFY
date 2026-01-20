
export const CookieManager = {
  set(name: string, value: any, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },

  get(name: string) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(cookie.substring(nameEQ.length)));
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  delete(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};
