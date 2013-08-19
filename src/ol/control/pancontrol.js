goog.provide('ol.control.Pan');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.View2D');
goog.require('ol.control.Control');
goog.require('ol.coordinate');
goog.require('ol.css');
goog.require('ol.interaction.Interaction');



/**
 * Create a new control with 4 button, to pan to north, east, south, west.
 * To style this control use CSS selectors .ol-pan, .ol-pan .ol-east, ...
 * If you define your own HTML you should define the id
 * north, south, east, west on the buttons.
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.PanOptions=} opt_options Options.
 */
ol.control.Pan = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};
  this.delta_ = goog.isDef(options.delta) ? options.delta : 128;
  /** @type {Element} */
  var element;
  var northElement, southElement, eastElement, westElement;

  if (goog.isDef(options.html)) {
    element = /** @type {Element} */
        (goog.dom.htmlToDocumentFragment(options.html));

    northElement = this.elementCast_(
        goog.dom.findNode(element, function(domElement) {
          return domElement.id == 'north';
        }));
    southElement = this.elementCast_(
        goog.dom.findNode(element, function(domElement) {
          return domElement.id == 'south';
        }));
    eastElement = this.elementCast_(
        goog.dom.findNode(element, function(domElement) {
          return domElement.id == 'east';
        }));
    westElement = this.elementCast_(
        goog.dom.findNode(element, function(domElement) {
          return domElement.id == 'west';
        }));
  }
  else {
    var className = goog.isDef(options.className) ?
        options.className : 'ol-pan';

    northElement = goog.dom.createDom(goog.dom.TagName.A, {
      'href': '#north',
      'class': className + '-north'
    });
    southElement = goog.dom.createDom(goog.dom.TagName.A, {
      'href': '#south',
      'class': className + '-south'
    });
    eastElement = goog.dom.createDom(goog.dom.TagName.A, {
      'href': '#east',
      'class': className + '-east'
    });
    westElement = goog.dom.createDom(goog.dom.TagName.A, {
      'href': '#west',
      'class': className + '-west'
    });

    var span1Element = goog.dom.createDom(goog.dom.TagName.SPAN, '',
        northElement, eastElement);
    var span2Element = goog.dom.createDom(goog.dom.TagName.SPAN, '',
        westElement, southElement);

    var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE;
    element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses,
        span1Element, span2Element);
  }

  goog.events.listen(northElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.panNorth_, false, this);
  goog.events.listen(southElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.panSouth_, false, this);
  goog.events.listen(eastElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.panEast_, false, this);
  goog.events.listen(westElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.panWest_, false, this);

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });
};
goog.inherits(ol.control.Pan, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} browserEvent
 * @private
 */
ol.control.Pan.prototype.panNorth_ = function(browserEvent) {
  this.pan_(0, 1, browserEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent
 * @private
 */
ol.control.Pan.prototype.panSouth_ = function(browserEvent) {
  this.pan_(0, -1, browserEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent
 * @private
 */
ol.control.Pan.prototype.panEast_ = function(browserEvent) {
  this.pan_(1, 0, browserEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent
 * @private
 */
ol.control.Pan.prototype.panWest_ = function(browserEvent) {
  this.pan_(-1, 0, browserEvent);
};


/**
 * @param {number} directionX
 * @param {number} directionY
 * @param {goog.events.BrowserEvent} browserEvent
 * @private
 */
ol.control.Pan.prototype.pan_ =
    function(directionX, directionY, browserEvent) {
  browserEvent.preventDefault();
  var map = this.getMap();
  var view = map.getView().getView2D();
  goog.asserts.assertInstanceof(view, ol.View2D);
  var resolution = view.getResolution();
  /**
   * @type {number}
   */
  var rotation = view.getRotation();
  var mapUnitsDelta = resolution * this.delta_;
  var delta = [mapUnitsDelta * directionX, mapUnitsDelta * directionY];
  ol.coordinate.rotate(delta, rotation);
  ol.interaction.Interaction.pan(map, view, delta, 100);
};


/**
 * @param {Node|null|undefined} node Node.
 * @return {?Element}
 * @private
 */
ol.control.Pan.prototype.elementCast_ = function(node) {
  if (node instanceof Element) {
    return /** @type {Element} */ (node);
  }
  else {
    return null;
  }
};
