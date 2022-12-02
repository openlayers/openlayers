import Map from '../../../../src/ol/Map.js';
import MapboxVectorLayer from '../../../../src/ol/layer/MapboxVector.js';
import View from '../../../../src/ol/View.js';

new Map({
  layers: [
    new MapboxVectorLayer({
      styleUrl:
        'data:,' +
        encodeURIComponent(
          JSON.stringify({
            version: 8,
            sources: {
              'foo': {
                tiles: ['/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf'],
                type: 'vector',
              },
            },
            layers: [
              {
                id: 'landuse',
                type: 'fill',
                source: 'foo',
                'source-layer': 'landuse',
                paint: {
                  'fill-color': '#ff0000',
                  'fill-opacity': 0.8,
                },
              },
            ],
          })
        ),
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 15,
  }),
});

render({
  message: 'MapboxVector layer renders with background',
  tolerance: 0.02,
});
