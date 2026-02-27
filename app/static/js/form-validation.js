document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[data-validate='inventory']");

  const syncShelvesByStore = (form) => {
    const storeSelect = form.querySelector("select[name$='store_id']");
    const shelfSelect = form.querySelector("select[name$='shelf_id']");

    if (!storeSelect || !shelfSelect) {
      return;
    }

    const selectedStoreId = storeSelect.value;
    const shelfOptions = Array.from(shelfSelect.options);
    for (const option of shelfOptions) {
      const optionStoreId = option.dataset.storeId;
      const isVisible = !optionStoreId || optionStoreId === selectedStoreId;

      option.hidden = !isVisible;
      option.disabled = !isVisible;
    }

    const selectedOption = shelfSelect.options[shelfSelect.selectedIndex];
    if (!selectedOption || selectedOption.hidden || selectedOption.disabled) {
      shelfSelect.value = "";
    }
  };

  for (const form of forms) {
    syncShelvesByStore(form);

    const storeSelect = form.querySelector("select[name$='store_id']");
    if (storeSelect) {
      storeSelect.addEventListener("change", () => syncShelvesByStore(form));
    }

    form.addEventListener("submit", (event) => {
      const stockInput = form.querySelector("input[name$='stock_count']");
      const shelfInput = form.querySelector("input[name$='shelf_count']");

      if (!stockInput || !shelfInput) {
        return;
      }

      const stockCount = Number.parseInt(stockInput.value, 10);
      const shelfCount = Number.parseInt(shelfInput.value, 10);

      shelfInput.setCustomValidity("");

      if (Number.isNaN(stockCount) || Number.isNaN(shelfCount)) {
        return;
      }

      if (shelfCount > stockCount) {
        const message = "shelfCount must be less than or equal to stockCount.";
        shelfInput.setCustomValidity(message);
        shelfInput.reportValidity();
        event.preventDefault();
      }
    });
  }
});
