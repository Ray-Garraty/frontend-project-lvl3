const generateId = (string) => string
  .split('')
  // eslint-disable-next-line no-bitwise
  .reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);

export default (data) => {
  const feed = {};
  const posts = [];
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xml');
  const error = parsedData.querySelector('parsererror');
  if (error) {
    return error;
  }
  const channelObject = parsedData.querySelector('channel');
  feed.title = channelObject.getElementsByTagName('title')[0].textContent;
  feed.description = channelObject.getElementsByTagName('description')[0].textContent;
  feed.id = generateId(feed.title);
  const coll = channelObject.getElementsByTagName('item');
  const array = Array.from(coll);
  array.forEach((item) => {
    posts.push({
      title: item.getElementsByTagName('title')[0].textContent,
      id: generateId(item.getElementsByTagName('title')[0].textContent),
      link: item.getElementsByTagName('link')[0].textContent,
      description: item.getElementsByTagName('description')[0].textContent,
    });
  });
  return { feed, posts };
};
