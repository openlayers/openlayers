/**
 * @module ol/format/GML3
 */
import GML2 from './GML2.js';
import GMLBase, {GMLNS} from './GMLBase.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Polygon from '../geom/Polygon.js';
import {
  OBJECT_PROPERTY_NODE_FACTORY,
  XML_SCHEMA_INSTANCE_URI,
  createElementNS,
  getAllTextContent,
  makeArrayExtender,
  makeArrayPusher,
  makeChildAppender,
  makeReplacer,
  makeSimpleNodeFactory,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop,
} from '../xml.js';
import {assign} from '../obj.js';
import {createOrUpdate} from '../extent.js';
import {extend} from '../array.js';
import {get as getProjection} from '../proj.js';
import {readNonNegativeIntegerString, writeStringTextNode} from './xsd.js';
import {
  transformExtentWithOptions,
  transformGeometryWithOptions,
} from './Feature.js';

/**
 * @const
 * @type {string}
 * @private
 */
const schemaLocation =
  GMLNS +
  ' http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/' +
  '1.0.0/gmlsf.xsd';

/**
 * @const
 * @type {Object<string, string>}
 */
const MULTIGEOMETRY_TO_MEMBER_NODENAME = {
  'MultiLineString': 'lineStringMember',
  'MultiCurve': 'curveMember',
  'MultiPolygon': 'polygonMember',
  'MultiSurface': 'surfaceMember',
};

/**
 * @classdesc
 * Feature format for reading and writing data in the GML format
 * version 3.1.1.
 * Currently only supports GML 3.1.1 Simple Features profile.
 *
 * @api
 */
class GML3 extends GMLBase {
  /**
   * @param {import("./GMLBase.js").Options} [opt_options] Optional configuration object.
   */
  constructor(opt_options) {
    const options =
      /** @type {import("./GMLBase.js").Options} */
      (opt_options ? opt_options : {});

    super(options);

    /**
     * @private
     * @type {boolean}
     */
    this.surface_ = options.surface !== undefined ? options.surface : false;

    /**
     * @private
     * @type {boolean}
     */
    this.curve_ = options.curve !== undefined ? options.curve : false;

    /**
     * @private
     * @type {boolean}
     */
    this.multiCurve_ =
      options.multiCurve !== undefined ? options.multiCurve : true;

    /**
     * @private
     * @type {boolean}
     */
    this.multiSurface_ =
      options.multiSurface !== undefined ? options.multiSurface : true;

    /**
     * @type {string}
     */
    this.schemaLocation = options.schemaLocation
      ? options.schemaLocation
      : schemaLocation;

    /**
     * @private
     * @type {boolean}
     */
    this.hasZ = options.hasZ !== undefined ? options.hasZ : false;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiLineString|undefined} MultiLineString.
   */
  readMultiCurve(node, objectStack) {
    /** @type {Array<LineString>} */
    const lineStrings = pushParseAndPop(
      [],
      this.MULTICURVE_PARSERS,
      node,
      objectStack,
      this
    );
    if (lineStrings) {
      const multiLineString = new MultiLineString(lineStrings);
      return multiLineString;
    } else {
      return undefined;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Polygon.
   */
  readFlatCurveRing(node, objectStack) {
    /** @type {Array<LineString>} */
    const lineStrings = pushParseAndPop(
      [],
      this.MULTICURVE_PARSERS,
      node,
      objectStack,
      this
    );
    const flatCoordinates = [];
    for (let i = 0, ii = lineStrings.length; i < ii; ++i) {
      extend(flatCoordinates, lineStrings[i].getFlatCoordinates());
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiPolygon|undefined} MultiPolygon.
   */
  readMultiSurface(node, objectStack) {
    /** @type {Array<Polygon>} */
    const polygons = pushParseAndPop(
      [],
      this.MULTISURFACE_PARSERS,
      node,
      objectStack,
      this
    );
    if (polygons) {
      return new MultiPolygon(polygons);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  curveMemberParser(node, objectStack) {
    parseNode(this.CURVEMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  surfaceMemberParser(node, objectStack) {
    parseNode(this.SURFACEMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<(Array<number>)>|undefined} flat coordinates.
   */
  readPatch(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.PATCHES_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} flat coordinates.
   */
  readSegment(node, objectStack) {
    return pushParseAndPop([], this.SEGMENTS_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<(Array<number>)>|undefined} flat coordinates.
   */
  readPolygonPatch(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.FLAT_LINEAR_RINGS_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} flat coordinates.
   */
  readLineStringSegment(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.GEOMETRY_FLAT_COORDINATES_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  interiorParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    const flatLinearRing = pushParseAndPop(
      undefined,
      this.RING_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRing) {
      const flatLinearRings =
        /** @type {Array<Array<number>>} */
        (objectStack[objectStack.length - 1]);
      flatLinearRings.push(flatLinearRing);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  exteriorParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    const flatLinearRing = pushParseAndPop(
      undefined,
      this.RING_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRing) {
      const flatLinearRings =
        /** @type {Array<Array<number>>} */
        (objectStack[objectStack.length - 1]);
      flatLinearRings[0] = flatLinearRing;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Polygon|undefined} Polygon.
   */
  readSurface(node, objectStack) {
    /** @type {Array<Array<number>>} */
    const flatLinearRings = pushParseAndPop(
      [null],
      this.SURFACE_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRings && flatLinearRings[0]) {
      const flatCoordinates = flatLinearRings[0];
      const ends = [flatCoordinates.length];
      let i, ii;
      for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
        extend(flatCoordinates, flatLinearRings[i]);
        ends.push(flatCoordinates.length);
      }
      return new Polygon(flatCoordinates, GeometryLayout.XYZ, ends);
    } else {
      return undefined;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {LineString|undefined} LineString.
   */
  readCurve(node, objectStack) {
    /** @type {Array<number>} */
    const flatCoordinates = pushParseAndPop(
      [null],
      this.CURVE_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatCoordinates) {
      const lineString = new LineString(flatCoordinates, GeometryLayout.XYZ);
      return lineString;
    } else {
      return undefined;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {import("../extent.js").Extent|undefined} Envelope.
   */
  readEnvelope(node, objectStack) {
    /** @type {Array<number>} */
    const flatCoordinates = pushParseAndPop(
      [null],
      this.ENVELOPE_PARSERS,
      node,
      objectStack,
      this
    );
    return createOrUpdate(
      flatCoordinates[1][0],
      flatCoordinates[1][1],
      flatCoordinates[2][0],
      flatCoordinates[2][1]
    );
  }

  /**
   * @param {Node} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Flat coordinates.
   */
  readFlatPos(node, objectStack) {
    let s = getAllTextContent(node, false);
    const re = /^\s*([+\-]?\d*\.?\d+(?:[eE][+\-]?\d+)?)\s*/;
    /** @type {Array<number>} */
    const flatCoordinates = [];
    let m;
    while ((m = re.exec(s))) {
      flatCoordinates.push(parseFloat(m[1]));
      s = s.substr(m[0].length);
    }
    if (s !== '') {
      return undefined;
    }
    const context = objectStack[0];
    const containerSrs = context['srsName'];
    let axisOrientation = 'enu';
    if (containerSrs) {
      const proj = getProjection(containerSrs);
      axisOrientation = proj.getAxisOrientation();
    }
    if (axisOrientation === 'neu') {
      let i, ii;
      for (i = 0, ii = flatCoordinates.length; i < ii; i += 3) {
        const y = flatCoordinates[i];
        const x = flatCoordinates[i + 1];
        flatCoordinates[i] = x;
        flatCoordinates[i + 1] = y;
      }
    }
    const len = flatCoordinates.length;
    if (len == 2) {
      flatCoordinates.push(0);
    }
    if (len === 0) {
      return undefined;
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Flat coordinates.
   */
  readFlatPosList(node, objectStack) {
    const s = getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
    const context = objectStack[0];
    const containerSrs = context['srsName'];
    const contextDimension = context['srsDimension'];
    let axisOrientation = 'enu';
    if (containerSrs) {
      const proj = getProjection(containerSrs);
      axisOrientation = proj.getAxisOrientation();
    }
    const coords = s.split(/\s+/);
    // The "dimension" attribute is from the GML 3.0.1 spec.
    let dim = 2;
    if (node.getAttribute('srsDimension')) {
      dim = readNonNegativeIntegerString(node.getAttribute('srsDimension'));
    } else if (node.getAttribute('dimension')) {
      dim = readNonNegativeIntegerString(node.getAttribute('dimension'));
    } else if (
      /** @type {Element} */ (node.parentNode).getAttribute('srsDimension')
    ) {
      dim = readNonNegativeIntegerString(
        /** @type {Element} */ (node.parentNode).getAttribute('srsDimension')
      );
    } else if (contextDimension) {
      dim = readNonNegativeIntegerString(contextDimension);
    }
    let x, y, z;
    const flatCoordinates = [];
    for (let i = 0, ii = coords.length; i < ii; i += dim) {
      x = parseFloat(coords[i]);
      y = parseFloat(coords[i + 1]);
      z = dim === 3 ? parseFloat(coords[i + 2]) : 0;
      if (axisOrientation.substr(0, 2) === 'en') {
        flatCoordinates.push(x, y, z);
      } else {
        flatCoordinates.push(y, x, z);
      }
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} value Point geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writePos_(node, value, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsDimension = hasZ ? '3' : '2';
    node.setAttribute('srsDimension', srsDimension);
    const srsName = context['srsName'];
    let axisOrientation = 'enu';
    if (srsName) {
      axisOrientation = getProjection(srsName).getAxisOrientation();
    }
    const point = value.getCoordinates();
    let coords;
    // only 2d for simple features profile
    if (axisOrientation.substr(0, 2) === 'en') {
      coords = point[0] + ' ' + point[1];
    } else {
      coords = point[1] + ' ' + point[0];
    }
    if (hasZ) {
      // For newly created points, Z can be undefined.
      const z = point[2] || 0;
      coords += ' ' + z;
    }
    writeStringTextNode(node, coords);
  }

  /**
   * @param {Array<number>} point Point geometry.
   * @param {string} [opt_srsName] Optional srsName
   * @param {boolean} [opt_hasZ] whether the geometry has a Z coordinate (is 3D) or not.
   * @return {string} The coords string.
   * @private
   */
  getCoords_(point, opt_srsName, opt_hasZ) {
    let axisOrientation = 'enu';
    if (opt_srsName) {
      axisOrientation = getProjection(opt_srsName).getAxisOrientation();
    }
    let coords =
      axisOrientation.substr(0, 2) === 'en'
        ? point[0] + ' ' + point[1]
        : point[1] + ' ' + point[0];
    if (opt_hasZ) {
      // For newly created points, Z can be undefined.
      const z = point[2] || 0;
      coords += ' ' + z;
    }

    return coords;
  }

  /**
   * @param {Element} node Node.
   * @param {LineString|import("../geom/LinearRing.js").default} value Geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writePosList_(node, value, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsDimension = hasZ ? '3' : '2';
    node.setAttribute('srsDimension', srsDimension);
    const srsName = context['srsName'];
    // only 2d for simple features profile
    const points = value.getCoordinates();
    const len = points.length;
    const parts = new Array(len);
    let point;
    for (let i = 0; i < len; ++i) {
      point = points[i];
      parts[i] = this.getCoords_(point, srsName, hasZ);
    }
    writeStringTextNode(node, parts.join(' '));
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} geometry Point geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writePoint(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const pos = createElementNS(node.namespaceURI, 'pos');
    node.appendChild(pos);
    this.writePos_(pos, geometry, objectStack);
  }

  /**
   * @param {Element} node Node.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {Array<*>} objectStack Node stack.
   */
  writeEnvelope(node, extent, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const keys = ['lowerCorner', 'upperCorner'];
    const values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      ({node: node}),
      this.ENVELOPE_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY,
      values,
      objectStack,
      keys,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/LinearRing.js").default} geometry LinearRing geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeLinearRing(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const posList = createElementNS(node.namespaceURI, 'posList');
    node.appendChild(posList);
    this.writePosList_(posList, geometry, objectStack);
  }

  /**
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [opt_nodeName] Node name.
   * @return {Node} Node.
   * @private
   */
  RING_NODE_FACTORY_(value, objectStack, opt_nodeName) {
    const context = objectStack[objectStack.length - 1];
    const parentNode = context.node;
    const exteriorWritten = context['exteriorWritten'];
    if (exteriorWritten === undefined) {
      context['exteriorWritten'] = true;
    }
    return createElementNS(
      parentNode.namespaceURI,
      exteriorWritten !== undefined ? 'interior' : 'exterior'
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Polygon} geometry Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeSurfaceOrPolygon(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    if (node.nodeName !== 'PolygonPatch' && srsName) {
      node.setAttribute('srsName', srsName);
    }
    if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
      const rings = geometry.getLinearRings();
      pushSerializeAndPop(
        {node: node, hasZ: hasZ, srsName: srsName},
        this.RING_SERIALIZERS,
        this.RING_NODE_FACTORY_,
        rings,
        objectStack,
        undefined,
        this
      );
    } else if (node.nodeName === 'Surface') {
      const patches = createElementNS(node.namespaceURI, 'patches');
      node.appendChild(patches);
      this.writeSurfacePatches_(patches, geometry, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {LineString} geometry LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeCurveOrLineString(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (node.nodeName !== 'LineStringSegment' && srsName) {
      node.setAttribute('srsName', srsName);
    }
    if (
      node.nodeName === 'LineString' ||
      node.nodeName === 'LineStringSegment'
    ) {
      const posList = createElementNS(node.namespaceURI, 'posList');
      node.appendChild(posList);
      this.writePosList_(posList, geometry, objectStack);
    } else if (node.nodeName === 'Curve') {
      const segments = createElementNS(node.namespaceURI, 'segments');
      node.appendChild(segments);
      this.writeCurveSegments_(segments, geometry, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {MultiPolygon} geometry MultiPolygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiSurfaceOrPolygon(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    const surface = context['surface'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const polygons = geometry.getPolygons();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName, surface: surface},
      this.SURFACEORPOLYGONMEMBER_SERIALIZERS,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_,
      polygons,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/MultiPoint.js").default} geometry MultiPoint geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiPoint(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    const hasZ = context['hasZ'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const points = geometry.getPoints();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName},
      this.POINTMEMBER_SERIALIZERS,
      makeSimpleNodeFactory('pointMember'),
      points,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {MultiLineString} geometry MultiLineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiCurveOrLineString(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    const curve = context['curve'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const lines = geometry.getLineStrings();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName, curve: curve},
      this.LINESTRINGORCURVEMEMBER_SERIALIZERS,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_,
      lines,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/LinearRing.js").default} ring LinearRing geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeRing(node, ring, objectStack) {
    const linearRing = createElementNS(node.namespaceURI, 'LinearRing');
    node.appendChild(linearRing);
    this.writeLinearRing(linearRing, ring, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {Polygon} polygon Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeSurfaceOrPolygonMember(node, polygon, objectStack) {
    const child = this.GEOMETRY_NODE_FACTORY_(polygon, objectStack);
    if (child) {
      node.appendChild(child);
      this.writeSurfaceOrPolygon(child, polygon, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} point Point geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writePointMember(node, point, objectStack) {
    const child = createElementNS(node.namespaceURI, 'Point');
    node.appendChild(child);
    this.writePoint(child, point, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {LineString} line LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeLineStringOrCurveMember(node, line, objectStack) {
    const child = this.GEOMETRY_NODE_FACTORY_(line, objectStack);
    if (child) {
      node.appendChild(child);
      this.writeCurveOrLineString(child, line, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Polygon} polygon Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeSurfacePatches_(node, polygon, objectStack) {
    const child = createElementNS(node.namespaceURI, 'PolygonPatch');
    node.appendChild(child);
    this.writeSurfaceOrPolygon(child, polygon, objectStack);
  }

  /**
   * @param {Element} node Node.
   * @param {LineString} line LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeCurveSegments_(node, line, objectStack) {
    const child = createElementNS(node.namespaceURI, 'LineStringSegment');
    node.appendChild(child);
    this.writeCurveOrLineString(child, line, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {import("../geom/Geometry.js").default|import("../extent.js").Extent} geometry Geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeGeometryElement(node, geometry, objectStack) {
    const context = /** @type {import("./Feature.js").WriteOptions} */ (
      objectStack[objectStack.length - 1]
    );
    const item = assign({}, context);
    item['node'] = node;
    let value;
    if (Array.isArray(geometry)) {
      value = transformExtentWithOptions(
        /** @type {import("../extent.js").Extent} */ (geometry),
        context
      );
    } else {
      value = transformGeometryWithOptions(
        /** @type {import("../geom/Geometry.js").default} */ (geometry),
        true,
        context
      );
    }
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      this.GEOMETRY_SERIALIZERS,
      this.GEOMETRY_NODE_FACTORY_,
      [value],
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../Feature.js").default} feature Feature.
   * @param {Array<*>} objectStack Node stack.
   */
  writeFeatureElement(node, feature, objectStack) {
    const fid = feature.getId();
    if (fid) {
      node.setAttribute('fid', /** @type {string} */ (fid));
    }
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureNS = context['featureNS'];
    const geometryName = feature.getGeometryName();
    if (!context.serializers) {
      context.serializers = {};
      context.serializers[featureNS] = {};
    }
    const keys = [];
    const values = [];
    if (feature.hasProperties()) {
      const properties = feature.getProperties();
      for (const key in properties) {
        const value = properties[key];
        if (value !== null) {
          keys.push(key);
          values.push(value);
          if (
            key == geometryName ||
            typeof (/** @type {?} */ (value).getSimplifiedGeometry) ===
              'function'
          ) {
            if (!(key in context.serializers[featureNS])) {
              context.serializers[featureNS][key] = makeChildAppender(
                this.writeGeometryElement,
                this
              );
            }
          } else {
            if (!(key in context.serializers[featureNS])) {
              context.serializers[featureNS][key] =
                makeChildAppender(writeStringTextNode);
            }
          }
        }
      }
    }
    const item = assign({}, context);
    item.node = node;
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      context.serializers,
      makeSimpleNodeFactory(undefined, featureNS),
      values,
      objectStack,
      keys
    );
  }

  /**
   * @param {Node} node Node.
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeFeatureMembers_(node, features, objectStack) {
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureType = context['featureType'];
    const featureNS = context['featureNS'];
    /** @type {Object<string, Object<string, import("../xml.js").Serializer>>} */
    const serializers = {};
    serializers[featureNS] = {};
    serializers[featureNS][featureType] = makeChildAppender(
      this.writeFeatureElement,
      this
    );
    const item = assign({}, context);
    item.node = node;
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      serializers,
      makeSimpleNodeFactory(featureType, featureNS),
      features,
      objectStack
    );
  }

  /**
   * @const
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [opt_nodeName] Node name.
   * @return {Node|undefined} Node.
   * @private
   */
  MULTIGEOMETRY_MEMBER_NODE_FACTORY_(value, objectStack, opt_nodeName) {
    const parentNode = objectStack[objectStack.length - 1].node;
    return createElementNS(
      this.namespace,
      MULTIGEOMETRY_TO_MEMBER_NODENAME[parentNode.nodeName]
    );
  }

  /**
   * @const
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [opt_nodeName] Node name.
   * @return {Element|undefined} Node.
   * @private
   */
  GEOMETRY_NODE_FACTORY_(value, objectStack, opt_nodeName) {
    const context = objectStack[objectStack.length - 1];
    const multiSurface = context['multiSurface'];
    const surface = context['surface'];
    const curve = context['curve'];
    const multiCurve = context['multiCurve'];
    let nodeName;
    if (!Array.isArray(value)) {
      nodeName = /** @type {import("../geom/Geometry.js").default} */ (
        value
      ).getType();
      if (nodeName === 'MultiPolygon' && multiSurface === true) {
        nodeName = 'MultiSurface';
      } else if (nodeName === 'Polygon' && surface === true) {
        nodeName = 'Surface';
      } else if (nodeName === 'LineString' && curve === true) {
        nodeName = 'Curve';
      } else if (nodeName === 'MultiLineString' && multiCurve === true) {
        nodeName = 'MultiCurve';
      }
    } else {
      nodeName = 'Envelope';
    }
    return createElementNS(this.namespace, nodeName);
  }

  /**
   * Encode a geometry in GML 3.1.1 Simple Features.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
   * @return {Node} Node.
   * @api
   */
  writeGeometryNode(geometry, opt_options) {
    opt_options = this.adaptOptions(opt_options);
    const geom = createElementNS(this.namespace, 'geom');
    const context = {
      node: geom,
      hasZ: this.hasZ,
      srsName: this.srsName,
      curve: this.curve_,
      surface: this.surface_,
      multiSurface: this.multiSurface_,
      multiCurve: this.multiCurve_,
    };
    if (opt_options) {
      assign(context, opt_options);
    }
    this.writeGeometryElement(geom, geometry, [context]);
    return geom;
  }

  /**
   * Encode an array of features in the GML 3.1.1 format as an XML node.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
   * @return {Element} Node.
   * @api
   */
  writeFeaturesNode(features, opt_options) {
    opt_options = this.adaptOptions(opt_options);
    const node = createElementNS(this.namespace, 'featureMembers');
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      this.schemaLocation
    );
    const context = {
      srsName: this.srsName,
      hasZ: this.hasZ,
      curve: this.curve_,
      surface: this.surface_,
      multiSurface: this.multiSurface_,
      multiCurve: this.multiCurve_,
      featureNS: this.featureNS,
      featureType: this.featureType,
    };
    if (opt_options) {
      assign(context, opt_options);
    }
    this.writeFeatureMembers_(node, features, [context]);
    return node;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS = {
  'http://www.opengis.net/gml': {
    'pos': makeReplacer(GML3.prototype.readFlatPos),
    'posList': makeReplacer(GML3.prototype.readFlatPosList),
    'coordinates': makeReplacer(GML2.prototype.readFlatCoordinates),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.FLAT_LINEAR_RINGS_PARSERS = {
  'http://www.opengis.net/gml': {
    'interior': GML3.prototype.interiorParser,
    'exterior': GML3.prototype.exteriorParser,
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.GEOMETRY_PARSERS = {
  'http://www.opengis.net/gml': {
    'Point': makeReplacer(GMLBase.prototype.readPoint),
    'MultiPoint': makeReplacer(GMLBase.prototype.readMultiPoint),
    'LineString': makeReplacer(GMLBase.prototype.readLineString),
    'MultiLineString': makeReplacer(GMLBase.prototype.readMultiLineString),
    'LinearRing': makeReplacer(GMLBase.prototype.readLinearRing),
    'Polygon': makeReplacer(GMLBase.prototype.readPolygon),
    'MultiPolygon': makeReplacer(GMLBase.prototype.readMultiPolygon),
    'Surface': makeReplacer(GML3.prototype.readSurface),
    'MultiSurface': makeReplacer(GML3.prototype.readMultiSurface),
    'Curve': makeReplacer(GML3.prototype.readCurve),
    'MultiCurve': makeReplacer(GML3.prototype.readMultiCurve),
    'Envelope': makeReplacer(GML3.prototype.readEnvelope),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.MULTICURVE_PARSERS = {
  'http://www.opengis.net/gml': {
    'curveMember': makeArrayPusher(GML3.prototype.curveMemberParser),
    'curveMembers': makeArrayPusher(GML3.prototype.curveMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.MULTISURFACE_PARSERS = {
  'http://www.opengis.net/gml': {
    'surfaceMember': makeArrayPusher(GML3.prototype.surfaceMemberParser),
    'surfaceMembers': makeArrayPusher(GML3.prototype.surfaceMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.CURVEMEMBER_PARSERS = {
  'http://www.opengis.net/gml': {
    'LineString': makeArrayPusher(GMLBase.prototype.readLineString),
    'Curve': makeArrayPusher(GML3.prototype.readCurve),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.SURFACEMEMBER_PARSERS = {
  'http://www.opengis.net/gml': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon),
    'Surface': makeArrayPusher(GML3.prototype.readSurface),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.SURFACE_PARSERS = {
  'http://www.opengis.net/gml': {
    'patches': makeReplacer(GML3.prototype.readPatch),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.CURVE_PARSERS = {
  'http://www.opengis.net/gml': {
    'segments': makeReplacer(GML3.prototype.readSegment),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.ENVELOPE_PARSERS = {
  'http://www.opengis.net/gml': {
    'lowerCorner': makeArrayPusher(GML3.prototype.readFlatPosList),
    'upperCorner': makeArrayPusher(GML3.prototype.readFlatPosList),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.PATCHES_PARSERS = {
  'http://www.opengis.net/gml': {
    'PolygonPatch': makeReplacer(GML3.prototype.readPolygonPatch),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML3.prototype.SEGMENTS_PARSERS = {
  'http://www.opengis.net/gml': {
    'LineStringSegment': makeArrayExtender(
      GML3.prototype.readLineStringSegment
    ),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml': {
    'LinearRing': makeReplacer(GMLBase.prototype.readFlatLinearRing),
    'Ring': makeReplacer(GML3.prototype.readFlatCurveRing),
  },
};

/**
 * Encode an array of features in GML 3.1.1 Simple Features.
 *
 * @function
 * @param {Array<import("../Feature.js").default>} features Features.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Options.
 * @return {string} Result.
 * @api
 */
GML3.prototype.writeFeatures;

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.RING_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'exterior': makeChildAppender(GML3.prototype.writeRing),
    'interior': makeChildAppender(GML3.prototype.writeRing),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.ENVELOPE_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'lowerCorner': makeChildAppender(writeStringTextNode),
    'upperCorner': makeChildAppender(writeStringTextNode),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.SURFACEORPOLYGONMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'surfaceMember': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygonMember
    ),
    'polygonMember': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygonMember
    ),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.POINTMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'pointMember': makeChildAppender(GML3.prototype.writePointMember),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.LINESTRINGORCURVEMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'lineStringMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember
    ),
    'curveMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember
    ),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML3.prototype.GEOMETRY_SERIALIZERS = {
  'http://www.opengis.net/gml': {
    'Curve': makeChildAppender(GML3.prototype.writeCurveOrLineString),
    'MultiCurve': makeChildAppender(GML3.prototype.writeMultiCurveOrLineString),
    'Point': makeChildAppender(GML3.prototype.writePoint),
    'MultiPoint': makeChildAppender(GML3.prototype.writeMultiPoint),
    'LineString': makeChildAppender(GML3.prototype.writeCurveOrLineString),
    'MultiLineString': makeChildAppender(
      GML3.prototype.writeMultiCurveOrLineString
    ),
    'LinearRing': makeChildAppender(GML3.prototype.writeLinearRing),
    'Polygon': makeChildAppender(GML3.prototype.writeSurfaceOrPolygon),
    'MultiPolygon': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon
    ),
    'Surface': makeChildAppender(GML3.prototype.writeSurfaceOrPolygon),
    'MultiSurface': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon
    ),
    'Envelope': makeChildAppender(GML3.prototype.writeEnvelope),
  },
};

export default GML3;
