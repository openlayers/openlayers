import Feature from '../src/ol/Feature.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
} from '../src/ol/style.js';
import {Cluster, Vector as VectorSource, XYZ} from '../src/ol/source.js';
import {LineString, Point, Polygon} from '../src/ol/geom.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {createEmpty, extend, getHeight, getWidth} from '../src/ol/extent.js';
import {fromLonLat} from '../src/ol/proj.js';

const circleDistanceMultiplier = 1;
const circleFootSeparation = 28;
const circleStartAngle = Math.PI / 2;

const convexHullFill = new Fill({
  color: 'rgba(255, 153, 0, 0.4)',
});
const convexHullStroke = new Stroke({
  color: 'rgba(204, 85, 0, 1)',
  width: 1.5,
});
const outerCircleFill = new Fill({
  color: 'rgba(255, 153, 102, 0.3)',
});
const innerCircleFill = new Fill({
  color: 'rgba(255, 165, 0, 0.7)',
});
const textFill = new Fill({
  color: '#fff',
});
const textStroke = new Stroke({
  color: 'rgba(0, 0, 0, 0.6)',
  width: 3,
});
const innerCircle = new CircleStyle({
  radius: 14,
  fill: innerCircleFill,
});
const outerCircle = new CircleStyle({
  radius: 20,
  fill: outerCircleFill,
});
const darkIcon = new Icon({
  src: 'data/icons/emoticon-cool.svg',
});
const lightIcon = new Icon({
  src: 'data/icons/emoticon-cool-outline.svg',
});

/**
 * Single feature style, users for clusters with 1 feature and cluster circles.
 * @param {Feature} clusterMember A feature from a cluster.
 * @return {Style} An icon style for the cluster member's location.
 */
function clusterMemberStyle(clusterMember) {
  return new Style({
    geometry: clusterMember.getGeometry(),
    image: clusterMember.get('LEISTUNG') > 5 ? darkIcon : lightIcon,
  });
}

let clickFeature, clickResolution;
/**
 * Style for clusters with features that are too close to each other, activated on click.
 * @param {Feature} cluster A cluster with overlapping members.
 * @param {number} resolution The current view resolution.
 * @return {Style} A style to render an expanded view of the cluster members.
 */
function clusterCircleStyle(cluster, resolution) {
  if (cluster !== clickFeature || resolution !== clickResolution) {
    return;
  }
  const clusterMembers = cluster.get('features');
  const centerCoordinates = cluster.getGeometry().getCoordinates();
  return generatePointsCircle(
    clusterMembers.length,
    cluster.getGeometry().getCoordinates(),
    resolution
  ).reduce((styles, coordinates, i) => {
    const point = new Point(coordinates);
    const line = new LineString([centerCoordinates, coordinates]);
    styles.unshift(
      new Style({
        geometry: line,
        stroke: convexHullStroke,
      })
    );
    styles.push(
      clusterMemberStyle(
        new Feature({
          ...clusterMembers[i].getProperties(),
          geometry: point,
        })
      )
    );
    return styles;
  }, []);
}

/**
 * From
 * https://github.com/Leaflet/Leaflet.markercluster/blob/31360f2/src/MarkerCluster.Spiderfier.js#L55-L72
 * Arranges points in a circle around the cluster center, with a line pointing from the center to
 * each point.
 * @param {number} count Number of cluster members.
 * @param {Array<number>} clusterCenter Center coordinate of the cluster.
 * @param {number} resolution Current view resolution.
 * @return {Array<Array<number>>} An array of coordinates representing the cluster members.
 */
function generatePointsCircle(count, clusterCenter, resolution) {
  const circumference =
    circleDistanceMultiplier * circleFootSeparation * (2 + count);
  let legLength = circumference / (Math.PI * 2); //radius from circumference
  const angleStep = (Math.PI * 2) / count;
  const res = [];
  let angle;

  legLength = Math.max(legLength, 35) * resolution; // Minimum distance to get outside the cluster icon.

  for (let i = 0; i < count; ++i) {
    // Clockwise, like spiral.
    angle = circleStartAngle + i * angleStep;
    res.push([
      clusterCenter[0] + legLength * Math.cos(angle),
      clusterCenter[1] + legLength * Math.sin(angle),
    ]);
  }

  return res;
}

let hoverFeature;
/**
 * Style for convex hulls of clusters, activated on hover.
 * @param {Feature} cluster The cluster feature.
 * @return {Style} Polygon style for the convex hull of the cluster.
 */
function clusterHullStyle(cluster) {
  if (cluster !== hoverFeature) {
    return;
  }
  const originalFeatures = cluster.get('features');
  const points = originalFeatures.map((feature) =>
    feature.getGeometry().getCoordinates()
  );
  return new Style({
    geometry: new Polygon([monotoneChainConvexHull(points)]),
    fill: convexHullFill,
    stroke: convexHullStroke,
  });
}

function clusterStyle(feature) {
  const size = feature.get('features').length;
  if (size > 1) {
    return [
      new Style({
        image: outerCircle,
      }),
      new Style({
        image: innerCircle,
        text: new Text({
          text: size.toString(),
          fill: textFill,
          stroke: textStroke,
        }),
      }),
    ];
  }
  const originalFeature = feature.get('features')[0];
  return clusterMemberStyle(originalFeature);
}

const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: 'data/geojson/photovoltaic.json',
});

const clusterSource = new Cluster({
  attributions:
    'Data: <a href="https://www.data.gv.at/auftritte/?organisation=stadt-wien">Stadt Wien</a>',
  distance: 35,
  source: vectorSource,
});

// Layer displaying the convex hull of the hovered cluster.
const clusterHulls = new VectorLayer({
  source: clusterSource,
  style: clusterHullStyle,
});

// Layer displaying the clusters and individual features.
const clusters = new VectorLayer({
  source: clusterSource,
  style: clusterStyle,
});

// Layer displaying the expanded view of overlapping cluster members.
const clusterCircles = new VectorLayer({
  source: clusterSource,
  style: clusterCircleStyle,
});

const raster = new TileLayer({
  source: new XYZ({
    attributions:
      'Base map: <a target="_blank" href="https://basemap.at/">basemap.at</a>',
    url: 'https://maps{1-4}.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png',
  }),
});

const map = new Map({
  layers: [raster, clusterHulls, clusters, clusterCircles],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    maxZoom: 19,
    extent: [
      ...fromLonLat([16.1793, 48.1124]),
      ...fromLonLat([16.5559, 48.313]),
    ],
    showFullExtent: true,
  }),
});

map.on('pointermove', (event) => {
  clusters.getFeatures(event.pixel).then((features) => {
    if (features[0] !== hoverFeature) {
      // Display the convex hull on hover.
      hoverFeature = features[0];
      clusterHulls.setStyle(clusterHullStyle);
      // Change the cursor style to indicate that the cluster is clickable.
      map.getTargetElement().style.cursor =
        hoverFeature && hoverFeature.get('features').length > 1
          ? 'pointer'
          : '';
    }
  });
});

map.on('click', (event) => {
  clusters.getFeatures(event.pixel).then((features) => {
    if (features.length > 0) {
      const clusterMembers = features[0].get('features');
      if (clusterMembers.length > 1) {
        // Calculate the extent of the cluster members.
        const extent = createEmpty();
        clusterMembers.forEach((feature) =>
          extend(extent, feature.getGeometry().getExtent())
        );
        const view = map.getView();
        const resolution = map.getView().getResolution();
        if (
          view.getZoom() === view.getMaxZoom() ||
          (getWidth(extent) < resolution && getHeight(extent) < resolution)
        ) {
          // Show an expanded view of the cluster members.
          clickFeature = features[0];
          clickResolution = resolution;
          clusterCircles.setStyle(clusterCircleStyle);
        } else {
          // Zoom to the extent of the cluster members.
          view.fit(extent, {duration: 500, padding: [50, 50, 50, 50]});
        }
      }
    }
  });
});
