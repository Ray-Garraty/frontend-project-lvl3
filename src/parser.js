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
      const itemTitle = titleElt.textContent;
      const linkElt = item.querySelector('link');
      const link = linkElt.textContent;
      const descriptionElt = item.querySelector('description');
      const itemDescription = descriptionElt.textContent;
      return { title: itemTitle, link, description: itemDescription };
    });
  return { title, description, items };
};
