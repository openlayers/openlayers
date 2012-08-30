/**
 * @externs
 */



/**
 * @constructor
 */
var BingMapsCoverageArea = function() {};


/**
 * @type {Array.<number>}
 */
BingMapsCoverageArea.prototype.bbox;


/**
 * @type {number}
 */
BingMapsCoverageArea.prototype.zoomMax;


/**
 * @type {number}
 */
BingMapsCoverageArea.prototype.zoomMin;



/**
 * @constructor
 */
var BingMapsImageryProvider = function() {};


/**
 * @type {string}
 */
BingMapsImageryProvider.prototype.attribution;


/**
 * @type {Array.<BingMapsCoverageArea>}
 */
BingMapsImageryProvider.prototype.coverageAreas;



/**
 * @constructor
 */
var BingMapsImageryMetadataResponse = function() {};


/**
 * @type {string}
 */
BingMapsImageryMetadataResponse.prototype.authenticationResultCode;


/**
 * @type {string}
 */
BingMapsImageryMetadataResponse.prototype.brandLogoUri;


/**
 * @type {string}
 */
BingMapsImageryMetadataResponse.prototype.copyright;


/**
 * @type {Array.<BingMapsResourceSet>}
 */
BingMapsImageryMetadataResponse.prototype.resourceSets;


/**
 * @type {number}
 */
BingMapsImageryMetadataResponse.prototype.statusCode;


/**
 * @type {string}
 */
BingMapsImageryMetadataResponse.prototype.statusDescription;


/**
 * @type {string}
 */
BingMapsImageryMetadataResponse.prototype.traceId;



/**
 * @constructor
 */
var BingMapsResource = function() {};


/**
 * @type {number}
 */
BingMapsResource.prototype.imageHeight;


/**
 * @type {string}
 */
BingMapsResource.prototype.imageUrl;


/**
 * @type {Array.<string>}
 */
BingMapsResource.prototype.imageUrlSubdomains;


/**
 * @type {number}
 */
BingMapsResource.prototype.imageWidth;


/**
 * @type {Array.<BingMapsImageryProvider>}
 */
BingMapsResource.prototype.imageryProviders;


/**
 * @type {Object}
 */
BingMapsResource.prototype.vintageEnd;


/**
 * @type {Object}
 */
BingMapsResource.prototype.vintageStart;


/**
 * @type {number}
 */
BingMapsResource.prototype.zoomMax;


/**
 * @type {number}
 */
BingMapsResource.prototype.zoomMin;



/**
 * @constructor
 */
var BingMapsResourceSet = function() {};


/**
 * @type {number}
 */
BingMapsResourceSet.prototype.estimatedTotal;


/**
 * @type {Array.<BingMapsResource>}
 */
BingMapsResourceSet.prototype.resources;
