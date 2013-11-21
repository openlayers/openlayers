goog.provide('ol.Transaction');

goog.require('goog.events');
goog.require('goog.object');
goog.require('ol.source.VectorEventType');



/**
 * Keeps track of pending feature edits.
 * @constructor
 */
ol.Transaction = function() {

  /**
   * Lookup for newly created features.
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.inserts_ = {};

  /**
   * Lookup for modified features.
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.updates_ = {};

  /**
   * Lookup for deleted features.
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.deletes_ = {};

  /**
   * The vector source associated with this transaction.
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = null;

  /**
   * Flag to indicate that a rollback is underway.
   * @type {boolean}
   * @private
   */
  this.rollingBack_ = false;

};


/**
 * Clear information about the added, changed, and removed features.
 */
ol.Transaction.prototype.reset = function() {
  this.inserts_ = {};
  this.updates_ = {};
  this.deletes_ = {};
};


/**
 * Revert all changes tracked by this transaction.
 */
ol.Transaction.prototype.rollback = function() {
  var source = this.source_,
      id, feature, features;

  if (goog.isNull(source)) {
    return;
  }

  // unload all inserted features
  source.unloadFeatures(goog.object.getValues(this.inserts_));

  // temporarily ignore featurechange events
  this.rollingBack_ = true;

  // reset all modified features
  for (id in this.updates_) {
    this.updates_[id].restoreOriginal();
  }

  // reload all deleted features
  features = [];
  for (id in this.deletes_) {
    feature = this.deletes_[id];
    feature.restoreOriginal();
    features.push(feature);
    source.loadFeatures(features);
  }

  this.reset();
  this.rollingBack_ = false;
};


/**
 * Get a lookup of all inserted features.
 * @return {Object.<string, ol.Feature>} Lookup object keyed by internal id.
 */
ol.Transaction.prototype.getInserts = function() {
  return this.inserts_;
};


/**
 * Get a lookup of all updated features.
 * @return {Object.<string, ol.Feature>} Lookup object keyed by internal id.
 */
ol.Transaction.prototype.getUpdates = function() {
  return this.updates_;
};


/**
 * Get a lookup of all deleted features.
 * @return {Object.<string, ol.Feature>} Lookup object keyed by internal id.
 */
ol.Transaction.prototype.getDeletes = function() {
  return this.deletes_;
};


/**
 * Start listening to a vector source for add, change, and remove events.  Call
 * with `null` to stop listening to the current source.
 * @param {ol.source.Vector} source The target source (or `null` to stop
 *     listening).
 */
ol.Transaction.prototype.setSource = function(source) {
  var oldSource = this.source_;
  if (!goog.isNull(oldSource)) {
    goog.events.unlisten(oldSource, ol.source.VectorEventType.ADD,
        this.handleFeatureAdd_, false, this);
    goog.events.unlisten(oldSource, ol.source.VectorEventType.CHANGE,
        this.handleFeatureChange_, false, this);
    goog.events.unlisten(oldSource, ol.source.VectorEventType.REMOVE,
        this.handleFeatureRemove_, false, this);
  }

  if (source) {
    goog.events.listen(source, ol.source.VectorEventType.ADD,
        this.handleFeatureAdd_, false, this);
    goog.events.listen(source, ol.source.VectorEventType.CHANGE,
        this.handleFeatureChange_, false, this);
    goog.events.listen(source, ol.source.VectorEventType.REMOVE,
        this.handleFeatureRemove_, false, this);
  }
  this.reset();
};


/**
 * Handler for featureadd events.
 * @param {ol.source.VectorEvent} evt The vector event (featureadd type).
 * @private
 */
ol.Transaction.prototype.handleFeatureAdd_ = function(evt) {
  var features = evt.features;
  var feature, id;
  for (var i = 0, len = features.length; i < len; ++i) {
    feature = features[i];
    id = goog.getUid(feature).toString();
    this.inserts_[id] = feature;
    delete this.updates_[id];
    delete this.deletes_[id];
  }
};


/**
 * Handler for featurechange events.
 * @param {ol.source.VectorEvent} evt The vector event (featurechange type).
 * @private
 */
ol.Transaction.prototype.handleFeatureChange_ = function(evt) {
  if (!this.rollingBack_) {
    var features = evt.features;
    var feature, id;
    for (var i = 0, len = features.length; i < len; ++i) {
      feature = features[i];
      id = goog.getUid(feature).toString();
      if (!this.inserts_.hasOwnProperty(id)) {
        this.updates_[id] = feature;
        delete this.deletes_[id];
      }
    }
  }
};


/**
 * Handler for featureremove events.
 * @param {ol.source.VectorEvent} evt The vector event (featureremove type).
 * @private
 */
ol.Transaction.prototype.handleFeatureRemove_ = function(evt) {
  var features = evt.features;
  var feature, id;
  for (var i = 0, len = features.length; i < len; ++i) {
    feature = features[i];
    id = goog.getUid(feature).toString();
    if (this.inserts_.hasOwnProperty(id)) {
      delete this.inserts_[id];
    } else {
      this.deletes_[id] = feature;
      delete this.updates_[id];
    }
  }
};
