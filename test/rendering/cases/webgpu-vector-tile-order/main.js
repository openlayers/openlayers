import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUTileLayer from '../../../../src/ol/layer/WebGPUTile.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  /**
   * @param {number} minLon Minimum longitude.
   * @param {number} minLat Minimum latitude.
   * @param {number} maxLon Maximum longitude.
   * @param {number} maxLat Maximum latitude.
   * @return {Array<Array<import("../../../../src/ol/coordinate.js").Coordinate>>} Ring.
   */
  function box(minLon, minLat, maxLon, maxLat) {
    return [
      [
        fromLonLat([minLon, minLat]),
        fromLonLat([maxLon, minLat]),
        fromLonLat([maxLon, maxLat]),
        fromLonLat([minLon, maxLat]),
        fromLonLat([minLon, minLat]),
      ],
    ];
  }

  const below = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature(new Polygon(box(-80, -40, -15, 40))),
        new Feature(new Point(fromLonLat([-47, 0]))),
      ],
    }),
    declutter: true,
    style: [
      {
        filter: ['==', ['geometry-type'], 'Polygon'],
        style: {
          'fill-color': '#ff00ff',
        },
      },
      {
        else: true,
        style: {
          'text-value': 'below',
          'text-font': 'bold 20px sans-serif',
          'text-fill-color': '#ffffff',
          'text-stroke-color': '#000000',
          'text-stroke-width': 3,
        },
      },
    ],
  });

  const tiles = new WebGPUTileLayer({
    source: new XYZ({
      url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      transition: 0,
    }),
  });

  const above = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature(new Polygon(box(15, -40, 80, 40))),
        new Feature(new Point(fromLonLat([47, 0]))),
      ],
    }),
    declutter: true,
    style: [
      {
        filter: ['==', ['geometry-type'], 'Polygon'],
        style: {
          'fill-color': '#00e5ff',
        },
      },
      {
        else: true,
        style: {
          'text-value': 'above',
          'text-font': 'bold 20px sans-serif',
          'text-fill-color': '#111111',
          'text-stroke-color': '#ffffff',
          'text-stroke-width': 3,
        },
      },
    ],
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [below, tiles, above],
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    const belowRenderer = below.getRenderer();
    const aboveRenderer = above.getRenderer();
    if (
      !belowRenderer?.helper ||
      !belowRenderer.buffers_?.commands?.length ||
      !tiles.getRenderer()?.helper ||
      !aboveRenderer?.helper ||
      !aboveRenderer.buffers_?.commands?.length
    ) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'Tiles cover a lower decluttered layer and sit under a higher one',
      tolerance: 0.02,
    });
  });
}
