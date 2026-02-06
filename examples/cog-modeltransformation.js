import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {fromProjectionCode, register} from '../src/ol/proj/proj4.js';
import {transformExtent} from '../src/ol/proj.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import OSM from '../src/ol/source/OSM.js';
import TileDebug from '../src/ol/source/TileDebug.js';

register(proj4);

const cogSource = new GeoTIFF({
  sources: [
    {
      url:
        'https://umbra-open-data-catalog.s3.amazonaws.com/sar-data/tasks/Tanna%20Island,%20Vanuatu/' +
        '9c76a918-9247-42bf-b9f6-3b4f672bc148/2023-02-12-21-33-56_UMBRA-04/2023-02-12-21-33-56_UMBRA-04_GEC.tif',
    },
  ],
});

const showTilesCheckbox = document.getElementById('show-tiles');
const debugLayer = new TileLayer({
  source: new TileDebug({source: cogSource}),
  visible: showTilesCheckbox.checked,
});
showTilesCheckbox.addEventListener('change', () => {
  debugLayer.setVisible(showTilesCheckbox.checked);
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      source: cogSource,
      opacity: 0.8,
    }),
    debugLayer,
  ],
  view: new View(),
});

cogSource.getView().then((viewConfig) =>
  fromProjectionCode(viewConfig.projection.getCode()).then(() => {
    const view = map.getView();
    view.fit(
      transformExtent(
        viewConfig.extent,
        viewConfig.projection,
        view.getProjection(),
      ),
    );
  }),
);
