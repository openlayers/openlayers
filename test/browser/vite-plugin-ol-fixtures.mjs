import fs from 'fs';
import path from 'path';
import send from 'send';
import {fileURLToPath} from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const blankPng = path.join(dir, 'spec/ol/data/blank.png');

// Fake service endpoints resolve to a blank image.
const proxies = {
  '/wms': blankPng,
  '/ogcapi/map': blankPng,
  '/ImageServer/exportImage': blankPng,
  '/MapServer/export': blankPng,
};

const fixtureTypes = new Set([
  '.html',
  '.json',
  '.geojson',
  '.xml',
  '.gml',
  '.kml',
  '.wkt',
  '.txt',
  '.png',
  '.jpg',
  '.gif',
  '.tif',
  '.woff2',
  '.mvt',
  '.pbf',
]);

function serve(req, res, file) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  send(req, path.basename(file), {
    root: path.dirname(file),
    cacheControl: false,
    etag: false,
    lastModified: false,
  })
    .on('error', (err) => {
      res.statusCode = err.status || 500;
      res.end(err.message);
    })
    .pipe(res);
}

// Serves the spec fixtures loaded over XHR (e.g. afterLoadText('spec/ol/...'))
// and the fake service endpoints.
export default function olFixtures() {
  return {
    name: 'ol-fixtures',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]);
        for (const prefix in proxies) {
          if (url === prefix || url.startsWith(prefix + '/')) {
            return serve(req, res, proxies[prefix]);
          }
        }
        // Only known data types, so test/source modules (.js) stay with Vite.
        const at = url.lastIndexOf('spec/');
        if (at !== -1 && fixtureTypes.has(path.extname(url))) {
          const file = path.join(dir, url.slice(at));
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            return serve(req, res, file);
          }
        }
        next();
      });
    },
  };
}
