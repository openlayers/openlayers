import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://spacenet-dataset.s3.amazonaws.com/spacenet/SN3_roads/train/AOI_3_Paris/PS-RGB/SN3_roads_train_AOI_3_Paris_PS-RGB_img101.tif',
      nodata: 0,
      min: [110, 216, 217],
      max: [586, 579, 432],
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [new TileLayer({source})],
  view: source.getView(),
});
