import puppeteer from "puppeteer"; 

 export default async function preparePuppeteer() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["javascript:close()"],
    protocolTimeout: 1000000,
  });
  // Create a new page
  // This will be used to navigate to the URLs and perform actions on the page
  const page = await browser.newPage();

  // Add the below 1 line of code
  // This will disable the timeout for navigation, allowing the page to load without timing out
  // This is useful for pages that take longer to load or have dynamic content
  page.setDefaultNavigationTimeout(0);

  // Set a custom user agent to mimic a real browser
  // This helps in avoiding detection as a bot and improves compatibility with some websites
  const customUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

  // Set custom user agent
  // This will make the requests appear as if they are coming from a real browser
  // This can help in avoiding detection as a bot and improve compatibility with some websites
  await page.setUserAgent(customUserAgent);

  //return the page instance
  // This will be used to navigate to the URLs and perform actions on the page
  return page;
}
