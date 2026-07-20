import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
  withZoom,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

// Point the url straight at the cube's `descending` orbit group, which keeps
// this a plain single-group source whose only non-spatial dimension is time.
const url =
  'https://s3.explorer.eopf.copernicus.eu/esa-zarr-sentinel-explorer-fra/tests-output/sentinel-1-grd-rtc-staging/s1-rtc-28RBS.zarr/descending';
const source = new GeoZarr({url, bands: ['vv', 'vh']});

// Dual-polarization composite from two geo-bands: VV -> red, VH -> green, and
// their ratio VV/VH -> blue. Radar backscatter is a small float, so each
// channel is rescaled from a fixed [low, high] range to the 0-255 display range.
const style = {
  color: [
    'color',
    ['interpolate', ['linear'], ['band', 1], 0, 0, 0.4, 255], // VV
    ['interpolate', ['linear'], ['band', 2], 0, 0, 0.1, 255], // VH
    ['interpolate', ['linear'], ['/', ['band', 1], ['band', 2]], 1, 0, 15, 255], // VV/VH
  ],
};

const map = new Map({
  target: 'map',
  layers: [new TileLayer({source: new OSM()}), new TileLayer({style, source})],
  view: getView(
    source,
    withLowerResolutions(1),
    withHigherResolutions(2),
    withExtentCenter(),
    withZoom(2),
  ),
});

const slider = document.getElementById('time');
const label = document.getElementById('time-label');

source
  .getDimensions()
  .then(async ({time}) => {
    const {units} = time.attributes;
    // units is something like "nanoseconds since 1970-01-01",
    const epoch = Date.parse(units.split(' since ')[1]);
    const toDate = (value) => new Date(epoch + Number(value) / 1e6);

    const slices = await Promise.all(
      [...Array(time.size).keys()].map(async (index) => ({
        index,
        date: toDate(await source.getValue('time', index)),
      })),
    );
    // The cube stores its time slices out of chronological order, so sort them.
    slices.sort((a, b) => a.date - b.date);

    function showSlice(position) {
      const {index, date} = slices[position];
      source.updateDimensions({time: index});
      label.textContent = date.toISOString().slice(0, 16).replace('T', ' ');
    }

    slider.max = String(time.size - 1);
    slider.disabled = false;
    slider.addEventListener('input', () => showSlice(Number(slider.value)));
    showSlice(0);
  })
  .catch(() => (label.textContent = 'Failed to load the GeoZarr store.'));
