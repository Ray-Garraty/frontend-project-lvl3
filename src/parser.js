export default (data, idGenerator) => {
  const feed = {};
  feed.items = [];
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xml');
  const error = parsedData.querySelector('parsererror');
  if (error) {
    return { error };
  }
  const channelObject = parsedData.querySelector('channel');
  feed.title = channelObject.getElementsByTagName('title')[0].textContent;
  feed.description = channelObject.getElementsByTagName('description')[0].textContent;
  feed.id = idGenerator();
  feed.items = Array.from(channelObject.getElementsByTagName('item'))
    .map((item) => {
      const result = {
        title: item.getElementsByTagName('title')[0].textContent,
        id: idGenerator(),
        link: item.getElementsByTagName('link')[0].textContent,
        description: item.getElementsByTagName('description')[0].textContent,
      };
      return result;
    });
  return { error, feed };
};
