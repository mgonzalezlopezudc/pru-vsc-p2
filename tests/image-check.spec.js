const { test } = require('@playwright/test');

test('image load check', async ({ page }) => {
  await page.goto('http://127.0.0.1:5000', { waitUntil: 'networkidle' });
  const details = await page.$$eval('img', (imgs) =>
    imgs.map((img) => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayed: img.offsetWidth > 0 && img.offsetHeight > 0,
    }))
  );
  console.log('IMAGE_REPORT=' + JSON.stringify(details));
});
