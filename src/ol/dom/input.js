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
      ol.Object.getChangedEventType(ol.dom.InputProperty.VALUE),
      this.handleValueChanged_, false, this);
  goog.events.listen(this,
      ol.Object.getChangedEventType(ol.dom.InputProperty.CHECKED),
      this.handleCheckedChanged_, false, this);
};
goog.inherits(ol.dom.Input, ol.Object);


/**
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
