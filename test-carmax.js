const https = require('https');

const options = {
  hostname: 'www.carmax.com',
  path: '/cars/all?zip=45429&radius=100',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s) ||
                  data.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/s) ||
                  data.match(/"vehicles"\s*:\s*(\[.+?\])/s);
    if (match) {
      console.log('FOUND DATA:', match[0].substring(0, 500));
    } else {
      console.log('No embedded data found');
      console.log('Page snippet:', data.substring(0, 1000));
    }
  });
}).on('error', e => console.error(e));