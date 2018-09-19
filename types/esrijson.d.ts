/**
 * An ESRI JSON coordinate reference system.
 */
interface EsriJSONCRS {
  /**
   * CRS well know identifier.
   */
  wkid: number;
}

/**
 * An ESRI JSON object.
 */
interface EsriJSONObject {
  spatialReference?: EsriJSONCRS;
}

/**
 * An ESRI JSON geometry object.
 */
interface EsriJSONGeometry extends EsriJSONObject {}

/**
 * An ESRI JSON point geometry.
 */
interface EsriJSONPoint extends EsriJSONGeometry {
  /**
   * X coordinate of point.
   */
  x: number;
  /**
   * Y coordinate of point.
   */
  y: number;
  /**
   * Z coordinate of point.
   */
  z?: number;
  /**
   * M value of point.
   */
  m?: number;
}

/**
 * An ESRI JSON object with a variable coordinate layout.
 */
interface ESRIJSONVariableLayout {
  /**
   * If coordinates have an M component. Omitting the property is equivalent to false.
   */
  hasM?: boolean;
  /**
   * If coordinates have a Z component. Omitting the property is equivalent to false.
   */
  hasZ?: boolean;
}

/**
 * An ESRI JSON multi-point geometry.
 */
interface EsriJSONMultipoint extends EsriJSONGeometry, ESRIJSONVariableLayout {
  points: number[][];
}

/**
 * An ESRI JSON polyline geometry.
 */
interface EsriJSONPolyline extends EsriJSONGeometry, ESRIJSONVariableLayout {
  paths: number[][][];
}

/**
 * An ESRI JSON polygon geometry.
 */
interface EsriJSONPolygon extends EsriJSONGeometry, ESRIJSONVariableLayout {
  rings: number[][][];
}

/**
 * An ESRI JSON multi-polygon geometry.
 */
interface EsriJSONMultiPolygon extends EsriJSONGeometry, ESRIJSONVariableLayout {
  rings: number[][][][];
}

/**
 * An ESRI JSON feature.
 */
interface EsriJSONFeature {
  attributes: object;
  geometry: EsriJSONGeometry;
}

/**
 * An ESRI JSON feature collection.
 */
interface EsriJSONFeatureCollection extends EsriJSONObject {
  features: EsriJSONFeature[];
  objectIdFieldName: string;
}
