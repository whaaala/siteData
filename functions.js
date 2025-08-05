//Function to get the content of an element
export const getElementContent = ($, element, selector, element1) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).text() || "No content";
  }
};

// Function to get the attribute value from a parent element
export const getAttributeValueFromParentElement = ($, element, attribute) => {
  return $(element).parent().attr(attribute) || "No attribute";
};

// Function to get the attribute value from a specific element
export const getElementAttributeValue = ($, element, selector, element1, attribute) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).attr(attribute) || "No attribute";
  }
};

// Function to get the content of an element
export const getContent = ($, element) => {
  if ($(element).length !== 0) {
    return $(element).text().trim() || "No content";
  }
};

// Function to get the attribute value of an element
export const getAttribute = ($, element, attr) => {
  if ($(element).length !== 0) {
    return $(element).attr(attr) || "No attribute";
  }
};

// Function to sleep for a specified number of milliseconds
// This is useful for adding delays in scraping to avoid overwhelming the server
export async function sleep(millseconds) {
  return new Promise((resolve) => setTimeout(resolve, millseconds));
}