goog.provide('ol.control.DragPan');

goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 */
ol.control.DragPan = function() {
  goog.base(this);
};
goog.inherits(ol.control.DragPan, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDrag = function(event) {
  window.console.log(
      'drag delta (' + this.deltaX + ', ' + this.deltaY + ')');
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragEnd = function(event) {
  window.console.log(
      'drag end at delta (' + this.deltaX + ', ' + this.deltaY + ')');
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragStart = function(event) {
  var browserEventObject = event.getBrowserEventObject();
  if (browserEventObject.shiftKey) {
    window.console.log('not starting drag while shift key is pressed');
    return false;
  } else {
    window.console.log(
        'drag start at (' + this.startX + ', ' + this.startY + ')');
    return true;
  }
};
