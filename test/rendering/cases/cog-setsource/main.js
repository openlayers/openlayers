import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const layer = new TileLayer({
  style: {
    color: ['array', ['band', 1], ['band', 1], ['band', 1], ['band', 2]],
  },
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

fetch('/data/raster/sentinel-b08.tif')
  .then((response) => response.blob())
  .then((blob) => {
    const source = new GeoTIFF({
      sources: [{blob: blob}],
      transition: 0,
    });

    layer.setSource(source);
    source.getView().then((options) => {
      map.setView(new View(options));
    });

    render({
      message: 'alpha styled from band 2',
    });
  });
