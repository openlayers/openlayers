import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {transformExtent} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

proj4.defs(
  'EPSG:25832',
  '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
);
register(proj4);

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/dop-rgb.tif',
    },
  ],
  transition: 0,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: source,
      background: 'red',
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
    'reprojects a geotiff without nodata without rendering opaque overflow',
});
