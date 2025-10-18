import {bbox as turfBbox} from '@turf/bbox';
import {bboxClip} from '@turf/bbox-clip';
import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {register} from '../src/ol/proj/proj4.js';
import {fromLonLat, get as getProjection, toLonLat} from '../src/ol/proj.js';
import RenderFeature from '../src/ol/render/Feature.js';
import VectorSource from '../src/ol/source/Vector.js';

// Equal Earth projection with dynamic center meridian
function dynEqualEarth(center, round = 15) {
  const lon0 = Math.round(center[0] / round) * round;
  const code = `EqualEarth${lon0}`;
  let prj = getProjection(code);
  if (!prj) {
    proj4.defs(
      code,
      `+proj=eqearth +lon_0=${lon0} +x_0=0 +y_0=0 +R=6371008.7714 +units=m +no_defs +type=crs`,
    );
    register(proj4);
    prj = getProjection(code);
    prj.setGlobal(true);
    prj.setExtent([-17243959.06, -8392927.6, 17243959.06, 8392927.6]);
    prj.setWorldExtent([-180, -90, 180, 90]);
  }

  return prj;
}

const initialProjection = dynEqualEarth([0, 0]);

(async () => {
  const response = await fetch(
    'https://openlayers.org/data/vector/ecoregions.json',
    // 'https://openlayersbook.github.io/openlayers_book_samples/assets/data/countries.geojson',
  );
  const geojson = await response.json();

  function jsonSource(geojson, projection) {
    return new VectorSource({
      features: new GeoJSON({
        featureProjection: projection,
        featureClass: RenderFeature,
      }).readFeatures(geojson),
      overlaps: false,
    });
  }

  const vectorLayer = new VectorLayer({
    source: jsonSource(geojson, initialProjection),
    extent: [-17243959.06, -8392927.6, 17243959.06, 8392927.6],
    wrapX: false,
    style: {
      'fill-color': ['string', ['get', 'COLOR'], '#eee'],
    },
  });

  const map = new Map({
    layers: [vectorLayer],
    target: 'map',
    view: new View({
      projection: initialProjection,
      center: [0, 0],
      zoom: 0,
      showFullExtent: true,
    }),
  });

  // Event handler for updating view projection
  function handleCenterChange() {
    const degStep = 5;
    const curView = map.getView();
    const center = toLonLat(curView.getCenter(), curView.getProjection());
    const newProjection = dynEqualEarth(center, degStep);
    if (curView.getProjection().getCode() !== newProjection.getCode()) {
      curView.un('change:center', handleCenterChange);
      const lon0 = Math.round(center[0] / degStep) * degStep;
      // Clip polygons at the new antimeridian to avoid rendering artifacts
      const clippedJson = clipPolygon(geojson, lon0);
      // Reload source to apply the new projection
      vectorLayer.setSource(jsonSource(clippedJson, newProjection));
      map.setView(
        new View({
          projection: newProjection,
          center: fromLonLat(center, newProjection),
          zoom: curView.getZoom(),
          rotation: curView.getRotation(),
          showFullExtent: true,
        }),
      );
      map.getView().on('change:center', handleCenterChange);
    }
  }

  map.getView().on('change:center', handleCenterChange);

  function clipPolygon(geojson, lon0) {
    const minX = lon0 - 180.0;
    const maxX = lon0 + 180.0;
    const clippedJson = {type: 'FeatureCollection', features: []};
    for (const feature of geojson.features) {
      const bbox = turfBbox(feature);
      const eps = 0.01;
      if (
        (bbox[0] < minX + eps && bbox[2] > minX - eps) ||
        (bbox[0] < maxX + eps && bbox[2] > maxX - eps)
      ) {
        const clippedFeat = bboxClip(feature, [minX, -90, maxX, 90]);
        const empty = clippedFeat.geometry.coordinates.every(
          (polygon) => !polygon.length,
        );
        if (!empty) {
          clippedJson.features.push(clippedFeat);
        }

        const offset = bbox[0] < minX ? 360 : -360;
        const transformedFeat = structuredClone(feature);
        if (transformedFeat.geometry.type === 'Polygon') {
          transformedFeat.geometry.type = 'MultiPolygon';
          transformedFeat.geometry.coordinates = [
            transformedFeat.geometry.coordinates,
          ];
        }
        for (const polygon of transformedFeat.geometry.coordinates) {
          for (const ring of polygon) {
            for (const coord of ring) {
              coord[0] += offset;
            }
          }
        }
        const wrappedFeat = bboxClip(transformedFeat, [minX, -90, maxX, 90]);
        // Remove empty polygons
        // wrappedFeat.geometry.coordinates =
        //   wrappedFeat.geometry.coordinates.filter((polygon) => !polygon.length);
        // Remove empty rings
        wrappedFeat.geometry.coordinates = wrappedFeat.geometry.coordinates.map(
          (polygon) => polygon.filter((ring) => !ring.length),
        );
        clippedJson.features.push(wrappedFeat);
      } else {
        clippedJson.features.push(feature);
      }
    }
    return clippedJson;
  }

  const featureOverlay = new VectorLayer({
    source: new VectorSource(),
    map: map,
    style: {
      'stroke-color': 'rgba(255, 255, 255, 0.7)',
      'stroke-width': 2,
    },
  });

  let highlight;
  const displayFeatureInfo = function (pixel) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
      return feature;
    });

    const info = document.getElementById('info');
    if (feature) {
      info.innerHTML = feature.get('ECO_NAME') || '&nbsp;';
    } else {
      info.innerHTML = '&nbsp;';
    }

    if (feature !== highlight) {
      if (highlight) {
        featureOverlay.getSource().removeFeature(highlight);
      }
      if (feature) {
        featureOverlay.getSource().addFeature(feature);
      }
      highlight = feature;
    }
  };

  map.on('pointermove', function (evt) {
    if (evt.dragging) {
      return;
    }
    displayFeatureInfo(evt.pixel);
  });

  map.on('click', function (evt) {
    displayFeatureInfo(evt.pixel);
  });
})();
