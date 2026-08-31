import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const styles = {
    'Point': new Style({
      image: new CircleStyle({
        radius: 5,
        fill: null,
        stroke: new Stroke({color: 'red', width: 1}),
      }),
    }),
    'Polygon': new Style({
      stroke: new Stroke({color: 'blue', lineDash: [4], width: 3}),
      fill: new Fill({color: 'rgba(0, 0, 255, 0.1)'}),
    }),
    'GeometryCollection': new Style({
      stroke: new Stroke({color: 'magenta', width: 2}),
      fill: new Fill({color: 'magenta'}),
      image: new CircleStyle({
        radius: 10,
        fill: null,
        stroke: new Stroke({color: 'magenta'}),
      }),
    }),
  };

  const vector = new WebGPUVectorLayer({
    source: new VectorSource({
      features: new GeoJSON().readFeatures({
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [0, 0]},
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': [
                [
                  [-5e6, -1e6],
                  [-3e6, -1e6],
                  [-4e6, 1e6],
                  [-5e6, -1e6],
                ],
              ],
            },
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'GeometryCollection',
              'geometries': [
                {
                  'type': 'LineString',
                  'coordinates': [
                    [-5e6, -5e6],
                    [0, -5e6],
                  ],
                },
                {'type': 'Point', 'coordinates': [4e6, -5e6]},
                {
                  'type': 'Polygon',
                  'coordinates': [
                    [
                      [1e6, -6e6],
                      [3e6, -6e6],
                      [2e6, -4e6],
                      [1e6, -6e6],
                    ],
                  ],
                },
              ],
            },
          },
        ],
      }),
    }),
    style: (feature) => styles[feature.getGeometry().getType()],
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [vector],
    target: 'map',
    view: new View({
      center: [0, -2.5e6],
      resolution: 40000,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!vector.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    setTimeout(() => map.render(), 400);
    setTimeout(() => {
      render({
        message:
          'Dashed polygon stroke, stroked circles, and a geometry collection using WebGPU',
      });
    }, 900);
  });
}
