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

const initialCenter = [11, 0];
const initialProjection = dynEqualEarth(initialCenter, 1);

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
    source: jsonSource(
      clipPolygon(geojson, initialCenter[0]),
      initialProjection,
    ),
    extent: initialProjection.getExtent(),
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
      center: initialCenter,
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
    function roundN(num, n = 10) {
      return Math.round(num * Math.pow(10, n)) / Math.pow(10, n);
    }
    const minX = lon0 - 180.0;
    const maxX = lon0 + 180.0;
    const clippedJson = {type: 'FeatureCollection', features: []};
    for (const feature of geojson.features) {
      const depth = feature.geometry.type === 'MultiPolygon' ? 2 : 1;
      const [featMinX, featMaxX] = feature.geometry.coordinates
        .flat(depth)
        .reduce(
          (minmax, coord) => [
            Math.min(minmax[0], coord[0]),
            Math.max(minmax[1], coord[0]),
          ],
          [Number.MAX_VALUE, Number.MIN_VALUE],
        );
      const eps = 0.01;
      if (
        (featMinX < minX + eps && featMaxX > minX - eps) ||
        (featMinX < maxX + eps && featMaxX > maxX - eps)
      ) {
        const offset = featMinX < minX ? 360 : -360;
        const feat = structuredClone(feature);
        if (feat.geometry.type === 'Polygon') {
          feat.geometry.type = 'MultiPolygon';
          feat.geometry.coordinates = [feat.geometry.coordinates];
        }

        const polys = [];
        for (const polygon of feat.geometry.coordinates) {
          const tpoly = structuredClone(polygon);
          const ncoords = polygon.reduce((sum, ring) => sum + ring.length, 0);
          let clamped = 0;
          for (const ring of polygon) {
            for (const coord of ring) {
              const x = coord[0];
              coord[0] = roundN(Math.min(Math.max(x, minX), maxX));
              if (coord[0] !== roundN(x)) {
                clamped++;
              }
            }
          }
          // Skip possibly degenerated polys with all coords clamped
          if (clamped < ncoords) {
            polys.push(polygon);
          }
          // Shift poly by 360° and clamp other part
          if (clamped) {
            let around180 = false;
            for (const ring of tpoly) {
              for (const coord of ring) {
                const x = coord[0] + offset;
                coord[0] = Math.min(Math.max(x, minX + eps), maxX - eps);
                // this still creates bad polys when coords are around 180°
                if (Math.abs(coord[0]) - 180 < 0.00000001) {
                  around180 = true;
                }
              }
            }
            if (!around180) {
              polys.push(tpoly);
            }
          }
        }
        feat.geometry.coordinates = polys;
        clippedJson.features.push(feat);
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
      info.innerHTML =
        feature.get('ECO_NAME') || feature.get('name') || '&nbsp;';
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
