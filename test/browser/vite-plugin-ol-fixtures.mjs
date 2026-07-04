import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const blankPng = path.join(dir, 'spec/ol/data/blank.png');

// Mirrors the karma `proxies`: fake service endpoints resolve to a blank image.
const proxies = {
  '/wms': blankPng,
  '/ogcapi/map': blankPng,
  '/ImageServer/exportImage': blankPng,
  '/MapServer/export': blankPng,
};

const types = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.geojson': 'application/json',
  '.xml': 'application/xml',
  '.gml': 'application/xml',
  '.kml': 'application/vnd.google-earth.kml+xml',
  '.wkt': 'text/plain',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.tif': 'image/tiff',
  '.woff2': 'font/woff2',
  '.mvt': 'application/octet-stream',
  '.pbf': 'application/octet-stream',
};

function send(req, res, file) {
  res.setHeader(
    'Content-Type',
    types[path.extname(file)] || 'application/octet-stream',
  );
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Accept-Ranges', 'bytes');

  const size = fs.statSync(file).size;
  const range = req.headers.range;
  if (range) {
    const [x, y] = range.replace('bytes=', '').split('-');
    const start = parseInt(x, 10) || 0;
    let end = parseInt(y, 10);
    if (isNaN(end) || end >= size) {
      end = size - 1;
    }
    if (start >= size) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${size}`);
      res.end();
      return;
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(file, {start, end}).pipe(res);
    return;
  }

  res.setHeader('Content-Length', size);
  fs.createReadStream(file).pipe(res);
}

// Serves the spec fixtures loaded over XHR (e.g. afterLoadText('spec/ol/...'))
// and the fake service endpoints, replacing the karma fixture serving.
export default function olFixtures() {
  return {
    name: 'ol-fixtures',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]);
        for (const prefix in proxies) {
          if (url === prefix || url.startsWith(prefix + '/')) {
            return send(req, res, proxies[prefix]);
          }
        }
        // Only known data types, so test/source modules (.js) stay with Vite.
        const at = url.lastIndexOf('spec/');
        if (at !== -1 && types[path.extname(url)]) {
          const file = path.join(dir, url.slice(at));
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            return send(req, res, file);
          }
        }
        next();
      });
    },
  };
}
