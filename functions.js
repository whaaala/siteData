export const getElementContent = ($, element, selector, element1) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).text() || "No content";
  }
};

export const getAttributeValueFromParentElement = ($, element, attribute) => {
  return $(element).parent().attr(attribute) || "No attribute";
};

export const getElementAttributeValue = (
  $,
  element,
  selector,
  element1,
  attribute
) => {
  if ($(element).find(selector).length !== 0 && selector === element1) {
    return $(element).find(selector).attr(attribute) || "No attribute";
  }
};

export const getContent = ($, element) => {
  if ($(element).length !== 0) {
    return $(element).text().trim() || "No content";
  }
};

export const getAttribute = ($, element, attr) => {
  if ($(element).length !== 0) {
    return $(element).attr(attr) || "No attribute";
  }
};

export async function sleep(millseconds) {
  return new Promise((resolve) => setTimeout(resolve, millseconds));
}