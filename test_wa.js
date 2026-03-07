const https = require('https');
const cheerio = require('cheerio');

function fetchRSS(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => req.destroy());
    });
}

(async () => {
    const data = await fetchRSS('https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS?Product=1');
    const $ = cheerio.load(data, { xmlMode: true });
    console.log('Total stations for Product=1:', $('item').length);
    const first = $('item').first();
    console.log('Price:', first.find('price').text());
    console.log('Lat:', first.find('latitude').text());
    console.log('Lng:', first.find('longitude').text());
    console.log('Brand:', first.find('brand').text());
    console.log('Name:', first.find('trading-name').text());
    console.log('Address:', first.find('address').text());
    console.log('Location:', first.find('location').text()); // This is suburb
})();
