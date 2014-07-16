goog.provide('ol.dom.Input');
goog.provide('ol.dom.InputProperty');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.dom.InputProperty = {
  VALUE: 'value',
  CHECKED: 'checked'
};



/**
 * @classdesc
 * Helper class for binding HTML input to an {@link ol.Object}.
 *
 * Example:
 *
 *     // bind a checkbox with id 'visible' to a layer's visibility
 *     var visible = new ol.dom.Input(document.getElementById('visible'));
 *     visible.bindTo('checked', layer, 'visible');
 *
 * @constructor
 * @extends {ol.Object}
 * @param {Element} target Target element.
 * @api
 */
ol.dom.Input = function(target) {
  goog.base(this);

  /**
   * @private
   * @type {HTMLInputElement}
   */
  this.target_ = /** @type {HTMLInputElement} */ (target);

  goog.events.listen(this.target_,
      [goog.events.EventType.CHANGE, goog.events.EventType.INPUT],
      this.handleInputChanged_, false, this);

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.dom.InputProperty.VALUE),
      this.handleValueChanged_, false, this);
  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.dom.InputProperty.CHECKED),
      this.handleCheckedChanged_, false, this);
};
goog.inherits(ol.dom.Input, ol.Object);


/**
 * If the input is a checkbox, return whether or not the checkbox is checked.
 * @return {boolean|undefined} The checked state of the Input.
 * @observable
 * @api
 */
ol.dom.Input.prototype.getChecked = function() {
  return /** @type {boolean} */ (this.get(ol.dom.InputProperty.CHECKED));
};
goog.exportProperty(
    ol.dom.Input.prototype,
    'getChecked',
    ol.dom.Input.prototype.getChecked);


/**
 * Get the value of the input.
 * @return {string|undefined} The value of the Input.
 * @observable
 * @api
 */
ol.dom.Input.prototype.getValue = function() {
  return /** @type {string} */ (this.get(ol.dom.InputProperty.VALUE));
};
goog.exportProperty(
    ol.dom.Input.prototype,
    'getValue',
    ol.dom.Input.prototype.getValue);


/**
 * Sets the value of the input.
 * @param {string} value The value of the Input.
 * @observable
 * @api
 */
ol.dom.Input.prototype.setValue = function(value) {
  this.set(ol.dom.InputProperty.VALUE, value);
};
goog.exportProperty(
    ol.dom.Input.prototype,
    'setValue',
    ol.dom.Input.prototype.setValue);


/**
 * Set whether or not a checkbox is checked.
 * @param {boolean} checked The checked state of the Input.
 * @observable
 * @api
 */
ol.dom.Input.prototype.setChecked = function(checked) {
  this.set(ol.dom.InputProperty.CHECKED, checked);
};
goog.exportProperty(
    ol.dom.Input.prototype,
    'setChecked',
    ol.dom.Input.prototype.setChecked);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.dom.Input.prototype.handleInputChanged_ = function(browserEvent) {
  goog.asserts.assert(browserEvent.currentTarget == this.target_);
  var target = this.target_;
  if (target.type === 'checkbox' || target.type === 'radio') {
    this.setChecked(target.checked);
  } else {
    this.setValue(target.value);
  }
};


/**
 * @param {goog.events.Event} event Change event.
 * @private
 */
ol.dom.Input.prototype.handleCheckedChanged_ = function(event) {
  this.target_.checked = /** @type {boolean} */ (this.getChecked());
};


/**
 * @param {goog.events.Event} event Change event.
 * @private
 */
ol.dom.Input.prototype.handleValueChanged_ = function(event) {
  this.target_.value =  /** @type {string} */ (this.getValue());
};
