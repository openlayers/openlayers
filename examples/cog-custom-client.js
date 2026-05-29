import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const dataUrl =
  'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif';

const source = new GeoTIFF({
  sources: [
    {
      url: dataUrl,
      // Use a custom loader function to control how the data is fetched.
      // The function receives the URL, request headers, and an abort signal.
      loader: (url, headers, abortSignal) => {
        // Add custom headers (e.g., authentication tokens)
        const customHeaders = {
          ...headers,
          // Example: 'Authorization': 'Bearer your-token-here',
        };

        // Optionally add custom logic (logging, retry logic, caching, etc.)

        return fetch(url, {
          headers: customHeaders,
          signal: abortSignal,
        });
      },
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: getView(source, withHigherResolutions(1), withExtentCenter()),
});
