$(function () {

  // Allow user configuration?
  const allowRegex = true;

  const reNotCache = {};
  function escapeRegexp(s, not) {
    if (not) {
      let re = reNotCache[not];
      if (!re) {
        const characters = '-\/\\^$*+?.()|[\]{}'.replace(new RegExp('[' + escapeRegexp(not) + ']', 'g'), '');
        re = reNotCache[not] = new RegExp('[' + escapeRegexp(characters) + ']', 'g');
      }
      return s.replace(re, '\\$&');
    }
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function constructRegex(searchTerm, makeRe, allowRegex) {
    try {
      if (allowRegex) {
        return makeRe(searchTerm);
      }
    } catch (e) {
    }
    return makeRe(escapeRegexp(searchTerm, '.'));
  }

  var getSearchWeight = function (searchTerm, $matchedItem) {
    let weight = 0;
    // We could get smarter on the weight here
    if ($matchedItem.data('shortname') === searchTerm) {
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

  // Show an item related a current documentation automatically
  const longname = $('.page-title').data('filename')
    .replace(/\.[a-z]+$/, '')
    .replace('module-', 'module:')
    .replace(/_/g, '/')
    .replace(/-/g, '~');
  var $currentItem = $('.navigation .item[data-name*="' + longname.toLowerCase() + '"]:eq(0)');

  if ($currentItem.length) {
    $currentItem
      .prependTo('.navigation .list')
      .show()
      .find('.member-list')
      .show();
  }

  function doSearch(searchTerm) {
    var $el = $('.navigation');

    if (searchTerm.length > 1) {
      searchTerm = searchTerm.toLowerCase();
      const regexp = constructRegex(searchTerm, function (searchTerm) {
        return new RegExp(searchTerm);
      }, allowRegex);
      $el.find('li, .member-list').hide();

      $el.find('li').each(function (i, v) {
        const $item = $(v);
        const name = $item.data('name');

        if (regexp.test(name)) {
          const $classEntry = $item.closest('.item');
          const $members = $item.closest('.member-list');

          // Do the weight thing
          const weight = getSearchWeight(searchTerm, $classEntry);
          $classEntry.data('weight', weight);

          $item.show();
          $members.show();
          $classEntry.show();
        }
      });

      $(".navigation ul.list li.item:visible")
        .sort(weightSorter) // sort elements
        .appendTo(".navigation ul.list"); // append again to the list

    } else {
      $currentItem.prependTo('.navigation .list');
      $currentItem.find('.member-list, li').show();
      $el.find('.item').show();
    }

    $el.find('.list').scrollTop(0);
  }

  const searchInput = $('#search').get(0);
  // Skip searches when typing fast.
  let key;
  let start;
  const brandNode = document.querySelector('.brand');
  function queueSearch() {
    if (!key) {
      start = Date.now();
      key = setTimeout(function () {
        key = undefined;

        const searchTerm = searchInput.value;
        doSearch(searchTerm);

        const time = Date.now() - start
        brandNode.innerHTML = time + ' ms';
        console.log(searchTerm + ':', time, 'ms');
        start = undefined;
      }, 0);
    }
  }

  // Search Items
  searchInput.addEventListener('input', queueSearch);

  // Toggle when click an item element
  $('.navigation').on('click', '.toggle', function (e) {
    $(this).parent().parent().find('.member-list').toggle();
  });

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
});
