import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import WebGLTileLayer from '../../../../../src/ol/layer/WebGLTile.js';
import {
  addCommon,
  clearAllProjections,
  get as getProjection,
  transform,
  transformExtent,
} from '../../../../../src/ol/proj.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {register} from '../../../../../src/ol/proj/proj4.js';

describe('ol/reproj/DataTile', () => {
  /** @type {Map} */
  let map, mapR;
  let target, targetR;
  let loader;

  beforeEach(() => {
    target = document.createElement('div');
    target.style.width = '256px';
    target.style.height = '256px';
    document.body.appendChild(target);

    targetR = document.createElement('div');
    targetR.style.width = '256px';
    targetR.style.height = '256px';
    document.body.appendChild(targetR);

    const size = 256;
    loader = (z, x, y) => {
      const output = new Uint8Array(size * size * 4);
      for (let j = 0; j < size; ++j) {
        for (let i = 0; i < size; ++i) {
          const offset = (j * size + i) * 4;
          output[offset] = i;
          output[offset + 1] = j;
          output[offset + 2] = i % 2 === 0 ? i : size - 1 - i;
          output[offset + 3] = j % 2 === 0 ? size - 1 - j : j;
        }
      }
      return output;
    };
  });

  afterEach(() => {
    map.setTarget(null);
    mapR.setTarget(null);
    document.body.removeChild(target);
    document.body.removeChild(targetR);
    delete proj4.defs['EPSG:27700'];
    clearAllProjections();
    addCommon();
  });

  it('pixel data reprojected from EPSG:4326 to EPSG:3857 exactly matches original', (done) => {
    target.style.width = '512px';
    map = new Map({
      target: target,
      view: new View({
        center: [0, 0],
        zoom: 1,
        multiWorld: true,
        projection: 'EPSG:4326',
      }),
    });

    targetR.style.width = '512px';
    targetR.style.height = '512px';
    mapR = new Map({
      target: targetR,
      view: new View({
        center: [0, 0],
        zoom: 1,
        multiWorld: true,
      }),
    });

    const source = new DataTileSource({
      loader: loader,
      transition: 0,
      projection: 'EPSG:4326',
      maxResolution: 180 / 256,
      maxZoom: 0,
    });
    const layer = new WebGLTileLayer({
      source: source,
    });
    const layerR = new WebGLTileLayer({
      source: source,
    });
    map.addLayer(layer);
    map.once('rendercomplete', () => {
      mapR.addLayer(layerR);
      mapR.once('rendercomplete', () => {
        for (let i = 0; i < 256; ++i) {
          const pixelR = [i + 0.5, i * 2 + 1];
          const coordinateR = mapR.getCoordinateFromPixel(pixelR);
          const dataR = layerR.getData(pixelR);
          const coordinate = transform(
            coordinateR,
            mapR.getView().getProjection(),
            map.getView().getProjection()
          );
          const pixel = map.getPixelFromCoordinate(coordinate);

          const dataA = [];
          for (let j = -1; j < 2; ++j) {
            dataA.push(layer.getData([pixel[0], pixel[1] + j]).toString());
          }
          expect(dataA).to.contain(dataR.toString());
        }
        done();
      });
    });
  });

  it('pixel data reprojected from EPSG:3857 to EPSG:4326 exactly matches original', (done) => {
    map = new Map({
      target: target,
      view: new View({
        center: [0, 0],
        zoom: 0,
        multiWorld: true,
      }),
    });

    targetR.style.width = '512px';
    mapR = new Map({
      target: targetR,
      view: new View({
        center: [0, 0],
        zoom: 1,
        multiWorld: true,
        projection: 'EPSG:4326',
      }),
    });

    const source = new DataTileSource({
      loader: loader,
      transition: 0,
      maxZoom: 0,
    });
    const layer = new WebGLTileLayer({
      source: source,
    });
    const layerR = new WebGLTileLayer({
      source: source,
    });
    map.addLayer(layer);
    map.once('rendercomplete', () => {
      mapR.addLayer(layerR);
      mapR.once('rendercomplete', () => {
        for (let i = 0; i < 256; ++i) {
          const pixelR = [i + 0.5, i + 0.5];
          const coordinateR = mapR.getCoordinateFromPixel(pixelR);
          if (Math.abs(coordinateR[1]) < 84) {
            const dataR = layerR.getData(pixelR);
            const coordinate = transform(
              coordinateR,
              mapR.getView().getProjection(),
              map.getView().getProjection()
            );
            const pixel = map.getPixelFromCoordinate(coordinate);

            const dataA = [];
            for (let j = -3; j < 4; ++j) {
              dataA.push(layer.getData([pixel[0], pixel[1] + j]).toString());
            }
            expect(dataA).to.contain(dataR.toString());
          }
        }
        done();
      });
    });
  });

  it('pixel data reprojected from EPSG:32636 to EPSG:32632 exactly matches original', (done) => {
    proj4.defs(
      'EPSG:32632',
      '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs'
    );
    proj4.defs(
      'EPSG:32636',
      '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
    );
    register(proj4);

    getProjection('EPSG:32632').setExtent([-3500000, 0, 4500000, 10000000]);
    getProjection('EPSG:32636').setExtent([-3500000, 0, 4500000, 10000000]);

    const extent = [539660, 1835050, 543590, 1838980];
    const tileGrid = createXYZ({extent: extent, maxZoom: 0});

    const source = new DataTileSource({
      loader: loader,
      transition: 0,
      tileGrid: tileGrid,
      projection: 'EPSG:32636',
    });
    const layer = new WebGLTileLayer({
      source: source,
    });
    const layerR = new WebGLTileLayer({
      source: source,
    });

    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        projection: 'EPSG:32636',
      }),
    });

    mapR = new Map({
      target: targetR,
      layers: [layerR],
      view: new View({
        projection: 'EPSG:32632',
      }),
    });

    map.getView().fit(extent);
    map.once('rendercomplete', () => {
      mapR
        .getView()
        .fit(
          transformExtent(
            extent,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          )
        );
      mapR.once('rendercomplete', () => {
        for (let i = 1; i < 255; ++i) {
          let pixel, coordinate, coordinateR, pixelR, dataR, dataA;
          const emptyData = new Uint8Array([0, 0, 0, 0]);

          pixel = [i + 0.5, i + 0.5];
          coordinate = map.getCoordinateFromPixel(pixel);
          coordinateR = transform(
            coordinate,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          );
          pixelR = mapR.getPixelFromCoordinate(coordinateR);
          dataR = layerR.getData(pixelR);

          dataA = [];
          for (let i = -1; i < 2; ++i) {
            for (let j = -1; j < 2; ++j) {
              const data = layer.getData([pixel[0] + i, pixel[1] + j]);
              dataA.push(data.toString());
            }
          }
          expect(dataA).to.contain(dataR.toString());

          pixel = [i + 0.5, 255.5 - i];
          coordinate = map.getCoordinateFromPixel(pixel);
          coordinateR = transform(
            coordinate,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          );
          pixelR = mapR.getPixelFromCoordinate(coordinateR);
          dataR = layerR.getData(pixelR);

          dataA = [];
          for (let i = -1; i < 2; ++i) {
            for (let j = -1; j < 2; ++j) {
              const data = layer.getData([pixel[0] + i, pixel[1] + j]);
              dataA.push(data.toString());
            }
          }
          expect(dataA).to.contain(dataR.toString());

          pixel = [i + 0.5, 1.5];
          coordinate = map.getCoordinateFromPixel(pixel);
          coordinateR = transform(
            coordinate,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          );
          pixelR = mapR.getPixelFromCoordinate(coordinateR);
          dataR = layerR.getData(pixelR);

          dataA = [];
          for (let i = -1; i < 2; ++i) {
            for (let j = -1; j < 2; ++j) {
              const data = layer.getData([pixel[0] + i, pixel[1] + j]);
              dataA.push(data.toString());
            }
          }
          expect(dataA).to.contain(dataR.toString());

          pixel = [1.5, i + 0.5];
          coordinate = map.getCoordinateFromPixel(pixel);
          coordinateR = transform(
            coordinate,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          );
          pixelR = mapR.getPixelFromCoordinate(coordinateR);
          dataR = layerR.getData(pixelR);

          dataA = [];
          for (let i = -1; i < 2; ++i) {
            for (let j = -1; j < 2; ++j) {
              const data = layer.getData([pixel[0] + i, pixel[1] + j]);
              dataA.push(data.toString());
            }
          }
          expect(dataA).to.contain(dataR.toString());

          pixel = [i + 0.5, 255.5];
          coordinate = map.getCoordinateFromPixel(pixel);
          coordinateR = transform(
            coordinate,
            map.getView().getProjection(),
            mapR.getView().getProjection()
          );
          pixelR = mapR.getPixelFromCoordinate(coordinateR);
          dataR = layerR.getData(pixelR);

          dataA = [];
          for (let i = -1; i < 2; ++i) {
            for (let j = -1; j < 2; ++j) {
              const data = layer.getData([pixel[0] + i, pixel[1] + j]);
              dataA.push((data || emptyData).toString());
            }
          }
          expect(dataA).to.contain(dataR.toString());
        }
        done();
      });
    });
  });
});
