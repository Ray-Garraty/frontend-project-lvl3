import _ from 'lodash';
import xml2js from 'xml2js';

const generateId = (string) => string
  .split('')
  // eslint-disable-next-line no-bitwise
  .reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);

export default (data) => {
  let feed = {};
  let posts = [];
  const parser = new xml2js.Parser();
  parser.parseString(data, (err, result) => {
    if (_.has(result, 'rss')) {
      const [feedTitle] = result.rss.channel[0].title;
      const [feedDescription] = result.rss.channel[0].description;
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
    }
  });
  return { feed, posts };
};

/* axios.get('http://lorem-rss.herokuapp.com/feed')
  .then((response) => {
    const domparser = new DOMParser();
    const doc = domparser.parseFromString(response.data, 'application/xml');
    const document = doc.documentElement.childNodes[0];
    const items = document.querySelectorAll('channel > item');
    console.dir(items);
    // fs.writeFileSync('test.htm', doc.documentElement.innerHTML, 'utf-8');
    // console.log(doc.rss.channel[0].item);
  })
  .catch(console.error); */

// тут можно посмотреть, что именно выдаёт функция parseRssFeed:
/* axios.get('https://lorem-rss.herokuapp.com/feed')
  .then((response) => {
    const result = parseRssFeed(response.data);
    console.log(result);
}); */
