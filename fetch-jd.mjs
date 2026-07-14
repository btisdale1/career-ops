import { chromium } from 'playwright';

const url = 'https://job-boards.greenhouse.io/anthropic/jobs/5155195008';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();
