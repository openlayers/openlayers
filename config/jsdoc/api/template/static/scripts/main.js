$(function () {
  // Search Items
  $('#include_modules').change(function (e) {
    console.log('change');
    if ($(this).is(':checked')) {

    } else {

    }
  });

  var getSearchWeight = function (searchTerm, $matchedItem) {
    let weight = 0;
    // We could get smarter on the weight here
    if ($matchedItem.data('shortname')
      && $matchedItem.data('shortname').toLowerCase() === searchTerm.toLowerCase()) {
      weight++;
    }
    return weight;
  };

  // sort function callback
  var weightSorter = function (a, b) {
    var aW = $(a).data('weight') || 0;
    var bW = $(b).data('weight') || 0;
    return bW - aW;
  };

  // Search Items
  $('#search').on('keyup', function (e) {
    var value = $(this).val();
    var $el = $('.navigation');

    if (value && value.length > 1) {
      var regexp = new RegExp(value, 'i');
      $el.find('li, .itemMembers').hide();

      $el.find('li').each(function (i, v) {
        const $item = $(v);
        const name = $item.data('name');

        if (name && regexp.test(name)) {
          const $classEntry = $item.closest('.item');
          const $members = $item.closest('.itemMembers');

          // Do the weight thing
          $classEntry.removeData('weight');
          $classEntry.show();
          const weight = getSearchWeight(value, $classEntry);
          $classEntry.data('weight', weight);

          $members.show();
          $classEntry.show();
          $item.show();
        }
      });

      $(".navigation ul.list li.item:visible")
        .sort(weightSorter) // sort elements
        .appendTo(".navigation ul.list"); // append again to the list

    } else {
      $el.find('.item, .itemMembers').show();
    }

    $el.find('.list').scrollTop(0);
  });

  // Toggle when click an item element
  $('.navigation').on('click', '.toggle', function (e) {
    $(this).parent().parent().find('.itemMembers').toggle();
  });

  // Show an item related a current documentation automatically
  var filename = $('.page-title').data('filename')
    .replace(/\.[a-z]+$/, '')
    .replace('module-', 'module:')
    .replace(/_/g, '/')
    .replace(/-/g, '~');
  var $currentItem = $('.navigation .item[data-name*="' + filename + '"]:eq(0)');

  if ($currentItem.length) {
    $currentItem
      .remove()
      .prependTo('.navigation .list')
      .show()
      .find('.itemMembers')
      .show();
  }

  // Auto resizing on navigation
  var _onResize = function () {
    var height = $(window).height();
    var $el = $('.navigation');

    $el.height(height).find('.list').height(height - 133);
  };

  $(window).on('resize', _onResize);
  _onResize();

  var currentVersion = document.getElementById('package-version').innerHTML;

  // warn about outdated version
  var packageUrl = 'https://raw.githubusercontent.com/openlayers/openlayers.github.io/build/package.json';
  fetch(packageUrl).then(function(response) {
    return response.json();
  }).then(function(json) {
    var latestVersion = json.version;
    document.getElementById('latest-version').innerHTML = latestVersion;
    var url = window.location.href;
    var branchSearch = url.match(/\/([^\/]*)\/apidoc\//);
    var cookieText = 'dismissed=-' + latestVersion + '-';
    var dismissed = document.cookie.indexOf(cookieText) != -1;
    if (branchSearch && !dismissed && /^v[0-9\.]*$/.test(branchSearch[1]) && currentVersion != latestVersion) {
      var link = url.replace(branchSearch[0], '/latest/apidoc/');
      fetch(link, {method: 'head'}).then(function(response) {
        var a = document.getElementById('latest-link');
        a.href = response.status == 200 ? link : '../../latest/apidoc/';
      });
      var latestCheck = document.getElementById('latest-check');
      latestCheck.style.display = '';
      document.getElementById('latest-dismiss').onclick = function() {
        latestCheck.style.display = 'none';
        document.cookie = cookieText;
      }
    }
  });

  // create source code links to github
  var srcLinks = $('div.tag-source');
  srcLinks.each(function(i, el) {
    var textParts = el.innerHTML.trim().split(', ');
    var link = 'https://github.com/openlayers/openlayers/blob/v' + currentVersion + '/src/ol/' +
      textParts[0];
    el.innerHTML = '<a href="' + link + '">' + textParts[0] + '</a>, ' +
      '<a href="' + link + textParts[1].replace('line ', '#L') + '">' +
      textParts[1] + '</a>';
  });

  // Highlighting current anchor

  var anchors = $('.anchor');
  var _onHashChange = function () {
    var activeHash = window.document.location.hash
      .replace(/\./g, '\\.') // Escape dot in element id
      .replace(/\~/g, '\\~'); // Escape tilde in element id

    anchors.removeClass('highlighted');

    if (activeHash.length > 0) {
      anchors.filter(activeHash).addClass('highlighted');
    }
  };

  $(window).on('hashchange', _onHashChange);
  _onHashChange();
});
