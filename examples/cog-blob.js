import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';

fetch('data/example.tif')
  .then((response) => response.blob())
  .then((blob) => {
    const source = new GeoTIFF({
      sources: [
        {
          blob: blob,
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
      view: source.getView().then((viewConfig) => {
        viewConfig.showFullExtent = true;
        return viewConfig;
      }),
    });
  });
