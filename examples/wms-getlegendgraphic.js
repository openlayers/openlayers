import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageWMS from '../src/ol/source/ImageWMS.js';
import OSM from '../src/ol/source/OSM.js';

const wmsSource = new ImageWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  ratio: 1,
  serverType: 'geoserver',
});

const updateLegend = function (resolution) {
  const graphicUrl = wmsSource.getLegendUrl(resolution);
  const img = /** @type {HTMLImageElement} */ (
    document.getElementById('legend')
  );
  img.src = graphicUrl;
};

const layers = [
  new TileLayer({
    source: new OSM(),
  }),
  new ImageLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: wmsSource,
  }),
];

const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
  }),
});

// Initial legend
const resolution = map.getView().getResolution();
updateLegend(resolution);

// Update the legend when the resolution changes
map.getView().on('change:resolution', function (event) {
  const resolution = event.target.getResolution();
  updateLegend(resolution);
});
