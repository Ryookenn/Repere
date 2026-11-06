// Appearance belongs to this device, independently of the synced notebook.
const appearance = (() => {
  const key = 'onemore.appearance';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const choices = {auto: 'Automatique', light: 'Clair', dark: 'Sombre'};
  let choice = localStorage.getItem(key);
  if (!Object.hasOwn(choices, choice)) choice = 'auto';
  function apply() {
    const dark = choice === 'dark' || (choice === 'auto' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#191918' : '#FCFAF6';
  }
  function set(value) {
    if (!Object.hasOwn(choices, value)) return;
    choice = value;
    localStorage.setItem(key, value);
    apply();
  }
  system.addEventListener('change', apply);
  apply();
  return {choices, set, get value() { return choice; }};
})();
