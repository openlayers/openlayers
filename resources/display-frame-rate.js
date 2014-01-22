/**
 * Display frame rate in a span element added to the navigation bar.
 */
(function() {

  var container = document.querySelector('.navbar .navbar-inner .container');
  if (!container) {
    return;
  }

  if (!window.requestAnimationFrame) {
    return;
  }

  var fpsElement = document.createElement('span');
  fpsElement.style.color = 'white';

  container.appendChild(fpsElement);

  var frameCount = 0;
  var begin = +new Date();

  window.setInterval(function() {
    var end = +new Date();
    var milliseconds = end - begin;
    var seconds = milliseconds / 1000.0;
    var frameRate = frameCount / seconds;
    fpsElement.innerHTML = frameRate.toPrecision(4) + ' fps';
    frameCount = 0;
    begin = end;
  }, 500);

  var go = function() {
    frameCount++;
    window.requestAnimationFrame(go);
  };
  go();

})();
