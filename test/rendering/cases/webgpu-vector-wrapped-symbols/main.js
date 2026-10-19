import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const marker =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">' +
        '<rect fill="#268bd2" stroke="#073642" stroke-width="2" x="1" y="1" width="18" height="18"/></svg>',
    );

  /**
   * @param {string} name Label.
   * @param {'point'|'line'} [placement] Text placement.
   * @return {Text} Text style.
   */
  function label(name, placement = 'point') {
    return new Text({
      text: name,
      font: 'bold 12px sans-serif',
      placement,
      fill: new Fill({color: '#111'}),
      stroke: new Stroke({color: '#fff', width: 3}),
      offsetY: placement === 'point' ? -14 : 0,
    });
  }

  // The view is centered on the antimeridian, so everything east of it comes
  // from the other end of the world and is shifted next to the western half.
  const features = [
    new Feature({
      geometry: new Point(fromLonLat([165, 20])),
      style: new Style({
        image: new CircleStyle({radius: 6, fill: new Fill({color: '#c40'})}),
        text: label('West'),
      }),
    }),
    new Feature({
      geometry: new Point(fromLonLat([-165, 20])),
      style: new Style({
        image: new CircleStyle({radius: 6, fill: new Fill({color: '#c40'})}),
        text: label('East'),
      }),
    }),
    new Feature({
      geometry: new Point(fromLonLat([-165, 0])),
      style: new Style({image: new Icon({src: marker})}),
    }),
    new Feature({
      geometry: new LineString([
        fromLonLat([-178, -20]),
        fromLonLat([-152, -20]),
      ]),
      style: new Style({
        stroke: new Stroke({color: '#859900', width: 4}),
        text: label('Line', 'line'),
      }),
    }),
    new Feature({
      geometry: new Polygon([
        [
          fromLonLat([-175, 30]),
          fromLonLat([-155, 30]),
          fromLonLat([-155, 44]),
          fromLonLat([-175, 44]),
          fromLonLat([-175, 30]),
        ],
      ]),
      style: new Style({
        fill: new Fill({color: 'rgba(108, 113, 196, 0.6)'}),
        text: label('Polygon'),
      }),
    }),
  ];

  const vector = new WebGPUVectorLayer({
    source: new VectorSource({features}),
    style: (feature) => feature.get('style'),
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [vector],
    target: 'map',
    view: new View({
      center: fromLonLat([180, 10]),
      resolution: 40000,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    // The device arrives a frame or two after the first one is complete, and
    // with no tiles to load nothing else asks for another.
    if (!vector.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      tolerance: 0.01,
      message:
        'Symbols and labels east of the antimeridian follow their geometry',
    });
  });
}
