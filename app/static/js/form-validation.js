document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[data-validate='inventory']");

  for (const form of forms) {
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
