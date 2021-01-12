export default (data) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xml');
  const error = parsedData.querySelector('parsererror');
  if (error) {
    throw new Error(error);
  }
  const channelElement = parsedData.querySelector('channel');
  const titleElement = channelElement.querySelector('title');
  const title = titleElement.textContent;
  const descriptionElement = channelElement.querySelector('description');
  const description = descriptionElement.textContent;
  const itemElements = channelElement.getElementsByTagName('item');
  const items = Array.from(itemElements)
    .map((item) => {
      const titleElt = item.querySelector('title');
      const title = titleElt.textContent;
      const linkElt = item.querySelector('link');
      const link = linkElt.textContent;
      const descriptionElt = item.querySelector('description');
      const description = descriptionElt.textContent;
      return { title, link, description };
    });
  return { title, description, items };
};
