/**
 * typedefs for the WFS sub-sub-namespace
 * See typedefs.js for more details
 */
goog.provide('ol.format.WFS.FeatureCollectionMetadata');
goog.provide('ol.format.WFS.TransactionResponse');


/**
 * Number of features; bounds/extent.
 * @typedef {{numberOfFeatures: number,
 *            bounds: ol.Extent}}
 * @api stable
 */
ol.format.WFS.FeatureCollectionMetadata;


/**
 * Total deleted; total inserted; total updated; array of insert ids.
 * @typedef {{totalDeleted: number,
 *            totalInserted: number,
 *            totalUpdated: number,
 *            insertIds: Array.<string>}}
 * @api stable
 */
ol.format.WFS.TransactionResponse;
