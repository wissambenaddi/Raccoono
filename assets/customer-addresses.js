(() => {
  const initializeAddressForm = (form) => {
    const countrySelect = form.querySelector('[data-address-country]');
    const provinceSelect = form.querySelector('[data-address-province]');
    const provinceContainer = form.querySelector('[data-address-province-container]');

    if (!(countrySelect instanceof HTMLSelectElement)) return;
    if (!(provinceSelect instanceof HTMLSelectElement)) return;
    if (!(provinceContainer instanceof HTMLElement)) return;

    const countryDefault = countrySelect.dataset.default;
    if (countryDefault) countrySelect.value = countryDefault;

    const updateProvinces = () => {
      const selectedOption = countrySelect.options[countrySelect.selectedIndex];
      let provinces = [];

      try {
        provinces = JSON.parse(selectedOption?.dataset.provinces || '[]');
      } catch {
        provinces = [];
      }

      provinceSelect.replaceChildren();
      provinces.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        provinceSelect.append(option);
      });

      const provinceDefault = provinceSelect.dataset.default;
      if (provinceDefault) provinceSelect.value = provinceDefault;
      provinceContainer.hidden = provinces.length === 0;
    };

    countrySelect.addEventListener('change', updateProvinces);
    updateProvinces();
  };

  const initialize = () => {
    document.querySelectorAll('.customer-address-form form').forEach(initializeAddressForm);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
