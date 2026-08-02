/**
 * @module ol/format/OSMXML
 */
// FIXME add typedef for stack state objects
import Feature from '../Feature.js';
import {extend} from '../array.js';
import LineString from '../geom/LineString.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {isEmpty} from '../obj.js';
import {get as getProjection} from '../proj.js';
import {makeParsersNS, pushParseAndPop} from '../xml.js';
import {transformGeometryWithOptions} from './Feature.js';
import XMLFeature from './XMLFeature.js';

/**
 * @typedef {Object<string, *>} OSMObject
 */

/**
 * @typedef {Object} OSMState
 * @property {Object<string, import("../coordinate.js").Coordinate>} nodes Nodes.
 * @property {Array<OSMObject>} ways Ways.
 * @property {Array<import("../Feature.js").default>} features Features.
 */

/**
 * @const
 * @type {Array<null>}
 */
const NAMESPACE_URIS = [null];

/**
 * @type {import("../xml.js").ParsersNS}
 */
const WAY_PARSERS = makeParsersNS(NAMESPACE_URIS, {
  'nd': readNd,
  'tag': readTag,
});

/**
 * @type {import("../xml.js").ParsersNS}
 */
const PARSERS = makeParsersNS(NAMESPACE_URIS, {
  'node': readNode,
  'way': readWay,
});

/**
 * @classdesc
 * Feature format for reading data in the
 * [OSMXML format](https://wiki.openstreetmap.org/wiki/OSM_XML).
 *
 * @api
 */
class OSMXML extends XMLFeature {
  constructor() {
    super();

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326') ?? undefined;
  }

  /**
   * @protected
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   * @override
   */
  readFeaturesFromNode(node, options) {
    options = this.getReadOptions(node, options);
    if (node.localName == 'osm') {
      const state = /** @type {OSMState} */ (
        pushParseAndPop(
          {
            nodes: {},
            ways: [],
            features: [],
          },
          PARSERS,
          node,
          [options],
        ) ?? {nodes: {}, ways: [], features: []}
      );
      // parse nodes in ways
      for (let j = 0; j < state.ways.length; j++) {
        const values = /** @type {OSMObject} */ (state.ways[j]);
        /** @type {Array<number>} */
        const flatCoordinates = /** @type {Array<number>} */ (
          values['flatCoordinates']
        );
        if (!flatCoordinates.length) {
          const ndrefs = /** @type {Array<string>} */ (values['ndrefs']);
          for (let i = 0, ii = ndrefs.length; i < ii; i++) {
            const point = state.nodes[ndrefs[i]];
            extend(flatCoordinates, point);
          }
        }
        let geometry;
        const ndrefs = /** @type {Array<string>} */ (values['ndrefs']);
        if (ndrefs[0] == ndrefs[ndrefs.length - 1]) {
          // closed way
          geometry = new Polygon(flatCoordinates, 'XY', [
            flatCoordinates.length,
          ]);
        } else {
          geometry = new LineString(flatCoordinates, 'XY');
        }
        transformGeometryWithOptions(geometry, false, options);
        const feature = new Feature(geometry);
        if (values['id'] !== undefined) {
          feature.setId(/** @type {string|number} */ (values['id']));
        }
        feature.setProperties(/** @type {OSMObject} */ (values['tags']), true);
        state.features.push(feature);
      }
      if (state.features) {
        return state.features;
      }
    }
    return [];
  }
}

/**
 * @type {import("../xml.js").ParsersNS}
 */
const NODE_PARSERS = makeParsersNS(NAMESPACE_URIS, {
  'tag': readTag,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readNode(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (
    objectStack[0]
  );
  const state = /** @type {OSMState} */ (objectStack[objectStack.length - 1]);
  const id = node.getAttribute('id');
  /** @type {import("../coordinate.js").Coordinate} */
  const coordinates = [
    parseFloat(node.getAttribute('lon') ?? '0'),
    parseFloat(node.getAttribute('lat') ?? '0'),
  ];
  if (id !== null) {
    state.nodes[id] = coordinates;
  }

  const values = /** @type {OSMObject|undefined} */ (
    pushParseAndPop({tags: {}}, NODE_PARSERS, node, objectStack)
  );
  if (values && !isEmpty(values['tags'])) {
    const geometry = new Point(coordinates);
    transformGeometryWithOptions(geometry, false, options);
    const feature = new Feature(geometry);
    if (id !== null) {
      feature.setId(id);
    }
    feature.setProperties(/** @type {OSMObject} */ (values['tags']), true);
    state.features.push(feature);
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readWay(node, objectStack) {
  const id = node.getAttribute('id');
  const values = /** @type {OSMObject} */ (
    pushParseAndPop(
      {
        id: id,
        ndrefs: [],
        flatCoordinates: [],
        tags: {},
      },
      WAY_PARSERS,
      node,
      objectStack,
    ) ?? {id: id, ndrefs: [], flatCoordinates: [], tags: {}}
  );
  const state = /** @type {OSMState} */ (objectStack[objectStack.length - 1]);
  state.ways.push(values);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readNd(node, objectStack) {
  const values = /** @type {OSMObject} */ (objectStack[objectStack.length - 1]);
  const ndrefs = /** @type {Array<string>} */ (values['ndrefs']);
  const ref = node.getAttribute('ref');
  if (ref !== null) {
    ndrefs.push(ref);
  }
  if (node.hasAttribute('lon') && node.hasAttribute('lat')) {
    const flatCoordinates = /** @type {Array<number>} */ (
      values['flatCoordinates']
    );
    flatCoordinates.push(parseFloat(node.getAttribute('lon') ?? '0'));
    flatCoordinates.push(parseFloat(node.getAttribute('lat') ?? '0'));
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readTag(node, objectStack) {
  const values = /** @type {OSMObject} */ (objectStack[objectStack.length - 1]);
  const tags = /** @type {OSMObject} */ (values['tags']);
  const key = node.getAttribute('k');
  if (key !== null) {
    tags[key] = node.getAttribute('v');
  }
}

export default OSMXML;
