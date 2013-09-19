;(function(){
  var container = document.querySelector('.navbar ul.pull-right'),
      li = document.createElement('li'),
      div = document.createElement('div'),
      select = document.createElement('select'),
      possibleModes = {
        'raw' : 'Development',
        'compiled': 'Production'
      },
      urlMode = window.location.href.match(/mode=([a-z0-9\-]+)\&?/i),
      curMode = urlMode ? urlMode[1] : 'compiled',
      option,
      modeIdx,
      mode,
      modeTxt,
      modeChangedMethod;

  modeChangedMethod = function() {
    var newMode = this.value,
        search = window.location.search.substring(1),
        baseUrl = window.location.href.split('?')[0],
        chunks = search ? search.split('&') : [],
        pairs = [],
        i,
        pair,
        adjusted;
    for (i = chunks.length - 1; i >= 0; --i) {
      pair = chunks[i].split('=');
      if (pair[0].toLowerCase() === 'mode') {
        pair[1] = newMode;
      }
      adjusted = encodeURIComponent(pair[0]);
      if (typeof pair[1] !== undefined) {
        adjusted += '=' + encodeURIComponent(pair[1] || '');
      }
      pairs.push(adjusted);
    }
    location.href = baseUrl + '?' + pairs.join('&');
  };

  for (mode in possibleModes) {
    if ( possibleModes.hasOwnProperty(mode) ) {
      option = document.createElement('option');
      modeTxt = possibleModes[mode];
      option.value = mode;
      option.innerHTML = modeTxt;
      option.selected = curMode === mode;
      select.appendChild(option);
    }
  }

  select.addEventListener('change', modeChangedMethod);
  select.className = 'input-medium';
  
  div.className = 'input-prepend';
  div.innerHTML = '<span class="add-on"><i class="icon-refresh"></i></span>';
  div.appendChild(select);

  li.appendChild(div);
  container.appendChild(li);
})();