import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

if (!navigator.gpu) {
  render({skip: true, message: 'WebGPU is not available'});
} else {
  const sprite = '/data/sprites/gis_symbols.png';
  const marker =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40">' +
        '<path fill="#268bd2" stroke="#073642" stroke-width="2" d="M16 1C8 1 2 7 2 15c0 11 14 24 14 24s14-13 14-24C30 7 24 1 16 1z"/>' +
        '<circle fill="white" cx="16" cy="15" r="5"/></svg>',
    );
  const features = [
    new Feature({geometry: new Point([-55, 48]), kind: 'sprite-a'}),
    new Feature({geometry: new Point([0, 48]), kind: 'sprite-b'}),
    new Feature({geometry: new Point([55, 48]), kind: 'sprite-c'}),
    new Feature({geometry: new Point([-50, -35]), kind: 'marker'}),
    new Feature({geometry: new Point([10, -35]), kind: 'rotated'}),
    new Feature({geometry: new Point([58, -35]), kind: 'paired'}),
  ];
  const styles = {
    'sprite-a': new Style({
      image: new Icon({src: sprite, size: [32, 32], offset: [0, 0]}),
    }),
    'sprite-b': new Style({
      image: new Icon({
        src: sprite,
        size: [32, 32],
        offset: [32, 0],
        color: '#d33682',
        scale: 1.25,
        opacity: 0.75,
      }),
    }),
    'sprite-c': new Style({
      image: new Icon({
        src: sprite,
        size: [32, 32],
        offset: [0, 0],
        anchor: [1, 1],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        displacement: [6, -5],
        declutterMode: 'none',
      }),
    }),
    marker: new Style({
      image: new Icon({src: marker, anchor: [0.5, 1]}),
    }),
    rotated: new Style({
      image: new Icon({
        src: marker,
        anchor: [0.5, 1],
        rotation: Math.PI / 4,
        rotateWithView: true,
        scale: [-1, 1],
        declutterMode: 'none',
      }),
    }),
    paired: new Style({
      image: new Icon({
        src: marker,
        anchor: [0.5, 1],
        declutterMode: 'declutter',
      }),
      text: new Text({
        text: 'icon',
        offsetY: 10,
        fill: new Fill({color: '#111'}),
        stroke: new Stroke({color: '#fff', width: 3}),
      }),
    }),
  };
  const layer = new WebGPUVectorLayer({
    source: new VectorSource({features}),
    declutter: true,
    style: (feature) => styles[feature.get('kind')],
  });
  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
      rotation: 0.2,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    setTimeout(() => {
      map.renderSync();
      render({
        message:
          'Sprite and standalone icons render with image style transforms',
        tolerance: 0.02,
      });
    }, 500);
  });
}
