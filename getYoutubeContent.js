import fetch from 'node-fetch';


const API_KEY = 'AIzaSyBlwSrqGJAXJ6wmpJhM7qRvC2e8bugQfjY'; // Replace with your API key
const channelIds = [
  'UCp5nhe2ZG718qVXeZ75KGG',
  'UCWr8HXcu6cpByw1PqMKUu7A',
  'UCrzOp3_GRW7BfQ5A2qyTsSA',
  'UCZmcE97PQqra4sQhvxUvBTA'
];

async function getLatestVideoId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.items && data.items.length > 0 && data.items[0].id.videoId) {
    return data.items[0].id.videoId;
  }
  return null;
}

async function getAllLatestVideos() {
  const videoIds = [];
  for (const channelId of channelIds) {
    const videoId = await getLatestVideoId(channelId);
    if (videoId) videoIds.push(videoId);
  }
  return videoIds;
}

function getYouTubeEmbedHtml(videoId) {
  return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
}

const homepageId = 504; // Replace with your homepage post/page ID
const embedHtml = (await getAllLatestVideos()).map(getYouTubeEmbedHtml).join('\n');

await fetch('https://stag-blogsites.itechnolabs.co.in/wp-json/wp/v2/pages/' + homepageId, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('wahala:vhST ICrX ZT6K Jgq1 TGv0 5uKJ').toString('base64'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: `<!-- wp:group --><div class="youtube-section">${embedHtml}</div><!-- /wp:group -->`
  })
});