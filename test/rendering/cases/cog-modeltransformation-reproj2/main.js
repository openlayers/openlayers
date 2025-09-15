import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {transformExtent} from '../../../../src/ol/proj.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs',
);

register(proj4);

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/ch-bw.tif',
    },
  ],
});

const map = new Map({
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  target: 'map',
  view: new View(),
});

source.getView().then((viewConfig) => {
  const view = map.getView();
  view.fit(
    transformExtent(
      viewConfig.extent,
      viewConfig.projection,
      view.getProjection(),
    ),
  );
});

render({
  message:
    'reprojects geotiffs that include a ModelTransformation to EPSG:3857',
});
