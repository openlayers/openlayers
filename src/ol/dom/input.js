goog.provide('ol.dom.Input');
goog.provide('ol.dom.InputProperty');

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
 * Helper class for binding HTML input to an ol.Object
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
 */
ol.dom.Input = function(target) {
  goog.base(this);

  /**
   * @private
   * @type {Element}
   */
  this.target_ = target;

  goog.events.listen(this.target_, goog.events.EventType.CHANGE,
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
 * If the input is a checkbox, return whether or not the checbox is checked.
 * @return {boolean|undefined} checked.
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
 * @return {string|undefined} input value.
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
 * @param {string} value Value.
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
 * @param {boolean} checked Checked.
 */
ol.dom.Input.prototype.setChecked = function(checked) {
  this.set(ol.dom.InputProperty.CHECKED, checked);
};
goog.exportProperty(
    ol.dom.Input.prototype,
    'setChecked',
    ol.dom.Input.prototype.setChecked);


/**
 * @private
 */
ol.dom.Input.prototype.handleInputChanged_ = function() {
  if (this.target_.type === 'checkbox' || this.target_.type === 'radio') {
    this.setChecked(this.target_.checked);
  } else {
    this.setValue(this.target_.value);
  }
};


/**
 * @private
 */
ol.dom.Input.prototype.handleCheckedChanged_ = function() {
  this.target_.checked = this.getChecked() ? 'checked' : undefined;
};


/**
 * @private
 */
ol.dom.Input.prototype.handleValueChanged_ = function() {
  this.target_.value = this.getValue();
};
