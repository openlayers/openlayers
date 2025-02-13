import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {transform} from '../src/ol/proj.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [new TileLayer({source})],
  view: new View({
    center: [0, 0],
    zoom: 12,
  }),
});

// after GeoTIFF metadata has been read, recenter the map to show the image
source.getView().then((sourceView) => {
  const view = map.getView();

  // transform the image center to view coorindates
  const center = transform(
    sourceView.center,
    sourceView.projection,
    view.getProjection(),
  );

  // update the view to show the image
  view.setCenter(center);
});
