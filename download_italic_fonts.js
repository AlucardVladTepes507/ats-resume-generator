const https = require('https');
const fs = require('fs');

async function downloadFont(weight, isItalic, filename) {
  return new Promise((resolve) => {
    const style = isItalic ? 'italic' : 'normal';
    const italicCode = isItalic ? '1,' : '0,';
    
    // Spoof Android 4.3 which only supported TTF, not WOFF.
    const options = {
      hostname: 'fonts.googleapis.com',
      path: `/css2?family=Merriweather:ital,wght@${italicCode}${weight}&display=swap`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; en-us; SM-N900T Build/JSS15J) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const urlMatch = data.match(/url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.ttf)\)/);
        if (urlMatch) {
          const ttfUrl = urlMatch[1];
          console.log(`Downloading ${filename} from ${ttfUrl}`);
          https.get(ttfUrl, (ttfRes) => {
            const file = fs.createWriteStream(filename);
            ttfRes.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          });
        } else {
          console.log('Could not find TTF URL in CSS for', filename, ':', data);
          resolve();
        }
      });
    });
  });
}

(async () => {
  await downloadFont(400, true, 'frontend/public/fonts/Merriweather-Italic.ttf');
  await downloadFont(700, true, 'frontend/public/fonts/Merriweather-BoldItalic.ttf');
  console.log('Done downloading italic fonts!');
})();

