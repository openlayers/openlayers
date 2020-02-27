$(function () {
  'use strict';

  // Allow user configuration?
  const allowRegex = true;
  const minInputForSearch = 1;
  const minInputForFullText = 2;
  const expandAllOnInputWithoutSearch = true;

  function constructRegex(searchTerm, makeRe, allowRegex) {
    try {
      if (allowRegex) {
        return makeRe(searchTerm);
      }
    } catch (e) {
    }
    // In case of invalid regexp fall back to non-regexp, but still allow . to match /
    return makeRe(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\./g, '[./]'));
  }

  function getWeightFunction(searchTerm, allowRegex) {
    function makeRe(searchTerm) {
      return {
        begin: new RegExp('\\b' + searchTerm), // Begin matches word boundary
        baseName: new RegExp('\\b' + searchTerm + '[^/]*$'), // Begin matches word boundary of class / module name
        fullName: new RegExp('\\b' + searchTerm + '(?:[~.]|$)'), // Complete word(s) of class / module matches
        completeName: new RegExp('^' + searchTerm + '$') // Match from start to finish
      }
    }
    const re = constructRegex(searchTerm, makeRe, allowRegex);
    return function (matchedItem, beginOnly) {
      // We could get smarter on the weight here
      const name = matchedItem.dataset.name;
      if (beginOnly) {
        return re.baseName.test(name) ? 100 : 1;
      }
      // If everything else is equal, prefer shorter names, and prefer classes over modules
      let weight = 10000 + matchedItem.dataset.longname.length - name.length * 100;
      if (name.match(re.begin)) {
        weight += 10000;
        if (re.baseName.test(name)) {
          weight += 10000;
          if (re.fullName.test(name)) {
            weight += 10000;
            if (re.completeName.test(name)) {
              weight += 10000;
            }
          }
        }
      }
      return weight;
    }
  }

  const search = (function () {
    const $navList = $('.navigation-list');
    const navListNode = $navList.get(0);
    let $classItems;
    let $members;
    let stateClass = (function () {
      $navList.removeClass('search-started searching');
      $navList.addClass('search-empty');
      return 'search-empty';
    })();
    let manualToggles = {};

    // Show an item related a current documentation automatically
    const longname = $('.page-title').data('filename')
      .replace(/\.[a-z]+$/, '')
      .replace('module-', 'module:')
      .replace(/_/g, '/')
      .replace(/-/g, '~');
    const currentItem = navListNode.querySelector('.item[data-longname="' + longname + '"]');
    if (currentItem) {
      $navList.prepend(currentItem);
    }
    return {
      $navList: $navList,
      $currentItem: currentItem ? $(currentItem) : undefined,
      lastSearchTerm: undefined,
      lastState: {},
      getClassList: function () {
        return $classItems || ($classItems = $navList.find('li.item'));
      },
      getMembers: function () {
        return $members || ($members = $navList.find('.item li'));
      },
      changeStateClass: function (newClass) {
        if (newClass !== stateClass) {
          navListNode.classList.remove(stateClass);
          navListNode.classList.add(newClass);
          stateClass = newClass;
        }
      },
      manualToggle: function ($node, show) {
        $node.addClass('toggle-manual');
        $node.toggleClass('toggle-manual-hide', !show);
        $node.toggleClass('toggle-manual-show', show);
        manualToggles[$node.data('longname')] = $node;
      },
      clearManualToggles: function() {
        for (let clsName in manualToggles) {
          manualToggles[clsName].removeClass('toggle-manual toggle-manual-show toggle-manual-hide');
        }
        manualToggles = {};
      },
    };
  })();

  const dummy = {subItems: {}};
  function clearOldMatches(lastState, searchState) {
    for (let itemName in lastState) {
      const lastItem = lastState[itemName];
      const item = searchState[itemName];
      if (!item) {
        lastItem.item.classList.remove('match');
      }
      if (lastItem.subItems) {
        clearOldMatches(lastItem.subItems, (item || dummy).subItems);
      }
    }
  }

  function doSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const lastSearchTerm = search.lastSearchTerm;
    if (searchTerm === lastSearchTerm) {
      return;
    }

    // Avoid layout reflow by scrolling to top first.
    search.$navList.scrollTop(0);
    search.lastSearchTerm = searchTerm;
    search.clearManualToggles();

    if (searchTerm.length < minInputForSearch) {
      const state = searchTerm.length && expandAllOnInputWithoutSearch ? 'search-started' : 'search-empty';
      search.changeStateClass(state);
      if (lastSearchTerm !== undefined && lastSearchTerm.length >= minInputForSearch) {
        // Restore the original, sorted order
        search.$navList.append(search.getClassList());
      }
      if (state === 'search-empty' && search.$currentItem) {
        search.manualToggle(search.$currentItem, true);
      }
    } else {
      search.changeStateClass('searching');
      searchTerm = searchTerm.toLowerCase();
      const beginOnly = searchTerm.length < minInputForFullText;
      const getSearchWeight = getWeightFunction(searchTerm, allowRegex);
      const re = constructRegex(searchTerm, function (searchTerm) {
        return new RegExp((beginOnly ? '\\b' : '') + searchTerm);
      }, allowRegex);
      const navList = search.$navList.get(0);
      const classes = [];
      const searchState = {};
      search.getClassList().each(function (i, classEntry) {
        const className = classEntry.dataset.longname;
        if (!(className in searchState) && re.test(classEntry.dataset.name)) {
          const cls = searchState[className] = {
            item: classEntry,
            // Do the weight thing
            weight: getSearchWeight(classEntry, beginOnly) * 100000,
            subItems: {}
          };
          classes.push(cls);
          classEntry.classList.add('match');
        }
      });
      search.getMembers().each(function (i, li) {
        const name = li.dataset.name;
        if (re.test(name)) {
          const itemMember = li.parentElement.parentElement;
          const classEntry = itemMember.parentElement;
          const className = classEntry.dataset.longname;
          let cls = searchState[className];
          if (!cls) {
            cls = searchState[className] = {
              item: classEntry,
              weight: 0,
              subItems: {}
            };
            classes.push(cls);
            classEntry.classList.add('match');
          }
          cls.weight += getSearchWeight(li, true);
          const memberType = itemMember.dataset.type;
          let members = cls.subItems[memberType];
          if (!members) {
            members = cls.subItems[memberType] = {
              item: itemMember,
              subItems: {}
            };
            itemMember.classList.add('match');
          }
          members.subItems[name] = { item: li };
          li.classList.add('match');
        }
      });
      clearOldMatches(search.lastState, searchState);
      search.lastState = searchState;

      classes.sort(function (a, b) {
        return a.weight - b.weight;
      });
      for (let i = classes.length - 1; i >= 0; --i) {
        navList.appendChild(classes[i].item);
      }
    }
  }

  const searchInput = $('#search').get(0);
  // Skip searches when typing fast.
  let key;
  function queueSearch() {
    if (!key) {
      key = setTimeout(function () {
        key = undefined;

        const searchTerm = searchInput.value;
        doSearch(searchTerm);
      }, 0);
    }
  }

  // Search Items
  searchInput.addEventListener('input', queueSearch);
  doSearch(searchInput.value);

  // Toggle when click an item element
  search.$navList.on('click', '.toggle', function (e) {
    if (event.target.tagName.toLowerCase() === 'a') {
      return;
    }
    const clsItem = $(this).closest('.item');
    let show;
    if (clsItem.hasClass('toggle-manual-show')) {
      show = false;
    } else if (clsItem.hasClass('toggle-manual-hide')) {
      show = true;
    } else {
      clsItem.find('.member-list li').each(function (i, v) {
        show = $(v).is(':hidden');
        return !show;
      });
    }
    search.manualToggle(clsItem, !!show);
  });

  // Auto resizing on navigation
  var _onResize = function () {
    var height = $(window).height();
    var $el = $('.navigation');

    $el.height(height).find('.navigation-list').height(height - 133);
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
