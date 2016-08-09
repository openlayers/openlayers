/*global Modernizr*/
goog.provide('ol.test.dom');

goog.require('goog.userAgent');
goog.require('ol.transform');
goog.require('ol.dom');

/*! modernizr 3.3.1 (Custom Build) | MIT
 *
 * This is a custom build of Modernizr, which is used to compare their result
 * of checking whether csstransforms & csstransforms3d are available with our
 * implementation.
 * The code below provides the following properties
 *   * `Modernizr.csstransforms`
 *   * `Modernizr.csstransforms3d`
 *
 * http://modernizr.com/download/?-csstransforms-csstransforms3d-setclasses
!*/
/*eslint-disable*/
!function(e,n,t){function r(e,n){return typeof e===n}function s(){var e,n,t,s,o,i,a;for(var f in C)if(C.hasOwnProperty(f)){if(e=[],n=C[f],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(s=r(n.fn,"function")?n.fn():n.fn,o=0;o<e.length;o++)i=e[o],a=i.split("."),1===a.length?Modernizr[a[0]]=s:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=s),y.push((s?"":"no-")+a.join("-"))}}function o(e){var n=S.className,t=Modernizr._config.classPrefix||"";if(x&&(n=n.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(r,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),x?S.className.baseVal=n:S.className=n)}function i(e,n){return!!~(""+e).indexOf(n)}function a(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):x?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}function f(e){return e.replace(/([a-z])-([a-z])/g,function(e,n,t){return n+t.toUpperCase()}).replace(/^-/,"")}function l(e,n){return function(){return e.apply(n,arguments)}}function u(e,n,t){var s;for(var o in e)if(e[o]in n)return t===!1?e[o]:(s=n[e[o]],r(s,"function")?l(s,t||n):s);return!1}function d(e){return e.replace(/([A-Z])/g,function(e,n){return"-"+n.toLowerCase()}).replace(/^ms-/,"-ms-")}function p(){var e=n.body;return e||(e=a(x?"svg":"body"),e.fake=!0),e}function c(e,t,r,s){var o,i,f,l,u="modernizr",d=a("div"),c=p();if(parseInt(r,10))for(;r--;)f=a("div"),f.id=s?s[r]:u+(r+1),d.appendChild(f);return o=a("style"),o.type="text/css",o.id="s"+u,(c.fake?c:d).appendChild(o),c.appendChild(d),o.styleSheet?o.styleSheet.cssText=e:o.appendChild(n.createTextNode(e)),d.id=u,c.fake&&(c.style.background="",c.style.overflow="hidden",l=S.style.overflow,S.style.overflow="hidden",S.appendChild(c)),i=t(d,e),c.fake?(c.parentNode.removeChild(c),S.style.overflow=l,S.offsetHeight):d.parentNode.removeChild(d),!!i}function m(n,r){var s=n.length;if("CSS"in e&&"supports"in e.CSS){for(;s--;)if(e.CSS.supports(d(n[s]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var o=[];s--;)o.push("("+d(n[s])+":"+r+")");return o=o.join(" or "),c("@supports ("+o+") { #modernizr { position: absolute; } }",function(e){return"absolute"==getComputedStyle(e,null).position})}return t}function h(e,n,s,o){function l(){d&&(delete E.style,delete E.modElem)}if(o=r(o,"undefined")?!1:o,!r(s,"undefined")){var u=m(e,s);if(!r(u,"undefined"))return u}for(var d,p,c,h,v,g=["modernizr","tspan"];!E.style;)d=!0,E.modElem=a(g.shift()),E.style=E.modElem.style;for(c=e.length,p=0;c>p;p++)if(h=e[p],v=E.style[h],i(h,"-")&&(h=f(h)),E.style[h]!==t){if(o||r(s,"undefined"))return l(),"pfx"==n?h:!0;try{E.style[h]=s}catch(y){}if(E.style[h]!=v)return l(),"pfx"==n?h:!0}return l(),!1}function v(e,n,t,s,o){var i=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+b.join(i+" ")+i).split(" ");return r(n,"string")||r(n,"undefined")?h(a,n,s,o):(a=(e+" "+P.join(i+" ")+i).split(" "),u(a,n,t))}function g(e,n,r){return v(e,t,t,n,r)}var y=[],C=[],w={_version:"3.3.1",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){C.push({name:e,fn:n,options:t})},addAsyncTest:function(e){C.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=w,Modernizr=new Modernizr;var S=n.documentElement,x="svg"===S.nodeName.toLowerCase(),_="Moz O ms Webkit",b=w._config.usePrefixes?_.split(" "):[];w._cssomPrefixes=b;var P=w._config.usePrefixes?_.toLowerCase().split(" "):[];w._domPrefixes=P;var z={elem:a("modernizr")};Modernizr._q.push(function(){delete z.elem});var E={style:z.elem.style};Modernizr._q.unshift(function(){delete E.style}),w.testAllProps=v,w.testAllProps=g,Modernizr.addTest("csstransforms",function(){return-1===navigator.userAgent.indexOf("Android 2.")&&g("transform","scale(1)",!0)});var T="CSS"in e&&"supports"in e.CSS,N="supportsCSS"in e;Modernizr.addTest("supports",T||N);var k=w.testStyles=c;Modernizr.addTest("csstransforms3d",function(){var e=!!g("perspective","1px",!0),n=Modernizr._config.usePrefixes;if(e&&(!n||"webkitPerspective"in S.style)){var t,r="#modernizr{width:0;height:0}";Modernizr.supports?t="@supports (perspective: 1px)":(t="@media (transform-3d)",n&&(t+=",(-webkit-transform-3d)")),t+="{#modernizr{width:7px;height:18px;margin:0;padding:0;border:0}}",k(r+t,function(n){e=7===n.offsetWidth&&18===n.offsetHeight})}return e}),s(),o(y),delete w.addTest,delete w.addAsyncTest;for(var A=0;A<Modernizr._q.length;A++)Modernizr._q[A]();e.Modernizr=Modernizr}(window,document);
/*eslint-enable*/

describe('ol.dom', function() {

  describe('ol.dom.createCanvasContext2D', function() {
    // default values from
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
    var defaultWidth = 300;
    var defaultHeight = 150;

    it('returns a CanvasRenderingContext2D', function() {
      var ctx = ol.dom.createCanvasContext2D();
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired width', function() {
      var ctx = ol.dom.createCanvasContext2D(42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(defaultHeight);
    });

    it('has the desired height', function() {
      var ctx = ol.dom.createCanvasContext2D(undefined, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(defaultWidth);
      expect(ctx.canvas.height).to.be(42);
    });

    it('has the desired height and width', function() {
      var ctx = ol.dom.createCanvasContext2D(42, 42);
      expect(ctx).to.be.a(CanvasRenderingContext2D);
      expect(ctx.canvas).to.be.a(HTMLCanvasElement);
      expect(ctx.canvas.width).to.be(42);
      expect(ctx.canvas.height).to.be(42);
    });

  });

  describe('ol.dom.canUseCssTransform', function() {

    it('always returns a boolean', function() {
      var canUse = ol.dom.canUseCssTransform();
      expect(typeof canUse).to.be('boolean');
    });

    it('returns the same result as the Modernizr implementation', function() {
      var canUse = ol.dom.canUseCssTransform();
      expect(canUse).to.be(Modernizr.csstransforms);
    });

  });

  describe('ol.dom.canUseCssTransform3D', function() {

    it('always returns a boolean', function() {
      var canUse = ol.dom.canUseCssTransform3D();
      expect(typeof canUse).to.be('boolean');
    });

    it('returns the same result as the Modernizr implementation', function() {
      var canUse = ol.dom.canUseCssTransform3D();
      expect(canUse).to.be(Modernizr.csstransforms3d);
    });

  });

  describe('ol.dom.setTransform', function() {
    var element = null;
    beforeEach(function() {
      element = document.createElement('div');
    });
    afterEach(function() {
      element = null;
    });

    it('sets style property "transform" and vendor-specific ones', function() {
      ol.dom.setTransform(element, 'rotate(48deg)');
      var properties = [
        'WebkitTransform',
        'MozTransform',
        'OTransform',
        'msTransform',
        'transform'
      ];
      properties.forEach(function(property) {
        expect(property in element.style).to.be(true);
        expect(element.style[property]).to.be('rotate(48deg)');
      });
    });

    it('sets transform origin for IE 9', function() {
      // save old user agent information
      var originalIsIE = goog.userAgent.IE;
      var originalIsVersionOrHigher = goog.userAgent.isVersionOrHigher;

      // Mock up IE 9
      goog.userAgent.IE = true;
      goog.userAgent.isVersionOrHigher = function() {
        return true;
      };

      ol.dom.setTransform(element, 'rotate(48deg)');
      expect(element.style.transformOrigin).to.not.be('');

      // revert mock-ups
      goog.userAgent.IE = originalIsIE;
      goog.userAgent.isVersionOrHigher = originalIsVersionOrHigher;
    });

    it('sets transform origin *only* for IE 9', function() {
      // save old user agent information
      var originalIsIE = goog.userAgent.IE;
      // Mock up some non-IE browser
      goog.userAgent.IE = false;

      ol.dom.setTransform(element, 'rotate(48deg)');
      expect(!element.style.transformOrigin).to.be(true);

      // revert mock-ups
      goog.userAgent.IE = originalIsIE;
    });

  });

  describe('ol.dom.transformElement2D', function() {
    var element = null;
    var transform = ol.transform.create();
    var transformFloat = ol.transform.create();
    transformFloat[0] = 0.12345;
    beforeEach(function() {
      element = document.createElement('div');
    });
    afterEach(function() {
      element = null;
    });

    it('first prefers 3D transforms if available', function() {
      // save original value
      var originalCanUse3D = ol.dom.canUseCssTransform3D;
      // mock up
      ol.dom.canUseCssTransform3D = function() {
        return true;
      };

      // test
      ol.dom.transformElement2D(element, transform);
      expect(element.style.transform).to.match(/matrix3d\(/);
      expect(element.style.left).to.not.be('0px');
      expect(element.style.top).to.not.be('0px');

      // revert mock-up
      ol.dom.canUseCssTransform3D = originalCanUse3D;
    });

    it('allows to configure precision for 3D transforms', function() {
      // save original value
      var originalCanUse3D = ol.dom.canUseCssTransform3D;
      // mock up
      ol.dom.canUseCssTransform3D = function() {
        return true;
      };

      // test
      ol.dom.transformElement2D(element, transformFloat, 2);
      expect(element.style.transform).to.match(/matrix3d\(0\.12/);

      // revert mock-up
      ol.dom.canUseCssTransform3D = originalCanUse3D;
    });

    it('second prefers 2D transforms if available', function() {
      // save original values
      var originalCanUse3D = ol.dom.canUseCssTransform3D;
      var originalCanUse2D = ol.dom.canUseCssTransform;
      // mock up
      ol.dom.canUseCssTransform3D = function() {
        return false;
      };
      ol.dom.canUseCssTransform = function() {
        return true;
      };

      // test
      ol.dom.transformElement2D(element, transform);
      expect(element.style.transform).to.match(/matrix\(/);
      expect(element.style.left).to.not.be('0px');
      expect(element.style.top).to.not.be('0px');

      // revert mock-up
      ol.dom.canUseCssTransform3D = originalCanUse3D;
      ol.dom.canUseCssTransform = originalCanUse2D;
    });

    it('allows to configure precision for 2D transforms', function() {
      // save original values
      var originalCanUse3D = ol.dom.canUseCssTransform3D;
      var originalCanUse2D = ol.dom.canUseCssTransform;
      // mock up
      ol.dom.canUseCssTransform3D = function() {
        return false;
      };
      ol.dom.canUseCssTransform = function() {
        return true;
      };

      // test
      ol.dom.transformElement2D(element, transformFloat, 2);
      expect(element.style.transform).to.match(/matrix\(0\.12/);

      // revert mock-up
      ol.dom.canUseCssTransform3D = originalCanUse3D;
      ol.dom.canUseCssTransform = originalCanUse2D;
    });

    it('uses "left" and "top" otherwise', function() {
      // save original values
      var originalCanUse3D = ol.dom.canUseCssTransform3D;
      var originalCanUse2D = ol.dom.canUseCssTransform;
      // mock up
      ol.dom.canUseCssTransform3D = function() {
        return false;
      };
      ol.dom.canUseCssTransform = function() {
        return false;
      };

      // test
      ol.dom.transformElement2D(element, transform);
      expect(element.style.left).to.be('0px');
      expect(element.style.top).to.be('0px');

      // revert mock-up
      ol.dom.canUseCssTransform3D = originalCanUse3D;
      ol.dom.canUseCssTransform = originalCanUse2D;
    });

  });

  describe('ol.dom.outerWidth', function() {
    var element = null;
    beforeEach(function() {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function() {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function() {

      it('calculates correctly', function() {
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(10);
      });

    });

    describe('with padding', function() {
      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });
    });

    describe('with margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });

    });

    describe('with border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(15);
      });

    });

    describe('with padding and margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.margin = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        element.style.marginLeft = '5px';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with padding and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(20);
      });

    });

    describe('with padding, margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(40);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginLeft = '5px';
        element.style.paddingLeft = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderRightWidth = '0';
        var calcWidth = ol.dom.outerWidth(element);
        expect(calcWidth).to.be(25);
      });

    });

  });

  describe('ol.dom.outerHeight', function() {
    var element = null;
    beforeEach(function() {
      element = document.createElement('div');
      element.style.padding = 0;
      element.style.margin = 0;
      element.style.border = 'none';
      element.style.width = '10px';
      element.style.height = '10px';
      document.body.appendChild(element);
    });
    afterEach(function() {
      element.parentNode.removeChild(element);
      element = null;
    });

    describe('without padding, margin or border', function() {

      it('calculates correctly', function() {
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(10);
      });

    });

    describe('with padding', function() {
      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });
    });

    describe('with margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });

    });

    describe('with border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

      it('calculates correctly (one side)', function() {
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(15);
      });

    });

    describe('with padding and margin', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.margin = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        element.style.marginTop = '5px';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with padding and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(30);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(20);
      });

    });

    describe('with padding, margin and border', function() {

      it('calculates correctly (both sides)', function() {
        element.style.margin = '5px';
        element.style.padding = '5px';
        element.style.border = '5px solid chocolate';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(40);
      });

      it('calculates correctly (one side)', function() {
        element.style.marginTop = '5px';
        element.style.paddingTop = '5px';
        element.style.border = '5px solid chocolate';
        element.style.borderBottomWidth = '0';
        var calcHeight = ol.dom.outerHeight(element);
        expect(calcHeight).to.be(25);
      });

    });

  });

});
