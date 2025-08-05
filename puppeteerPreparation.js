import puppeteer from "puppeteer"; 

 export default async function preparePuppeteer() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["javascript:close()"],
    protocolTimeout: 1000000,
  });
  // Create a new page
  const page = await browser.newPage();

  // Add the below 1 line of code
  page.setDefaultNavigationTimeout(0);

  const customUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

  // Set custom user agent
  await page.setUserAgent(customUserAgent);

  return page;
}
