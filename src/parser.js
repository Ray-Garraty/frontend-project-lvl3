import xml2js from 'xml2js';

const generateId = (string) => string
  .split('')
  // eslint-disable-next-line no-bitwise
  .reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);

export default (data) => {
  let feed;
  let posts;
  const parser = new xml2js.Parser();
  parser.parseString(data, (err, result) => {
    const [feedTitle] = result.rss.channel[0].title;
    const [feedDescription] = result.rss.channel[0].description;
    console.log(feedTitle);
    feed = {
      title: feedTitle,
      id: generateId(feedTitle),
      description: feedDescription,
    };
    posts = result.rss.channel[0].item.map((newsItem) => {
      const res = {
        title: newsItem.title[0],
        id: generateId(newsItem.title[0]),
        link: newsItem.link[0],
        description: newsItem.description[0],
      };
      return res;
    });
  });
  return { feed, posts };
};
