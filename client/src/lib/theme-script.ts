/** Inline script string injected in <head> to set data-theme before paint. */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('dd-theme')||'dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-density','regular');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
