$(function () {
    // Search Items
    $('#search').on('keyup', function (e) {
        var value = $(this).val();
        var $el = $('.navigation');

        if (value) {
            var regexp = new RegExp(value, 'i');
            $el.find('li, .itemMembers').hide();

            $el.find('li').each(function (i, v) {
                var $item = $(v);

                if ($item.data('name') && regexp.test($item.data('name'))) {
                    $item.show();
                    $item.closest('.itemMembers').show();
                    $item.closest('.item').show();
                }
            });
        } else {
            $el.find('.item, .itemMembers').show();
        }

        $el.find('.list').scrollTop(0);
    });

    // Toggle when click an item element
    $('.navigation').on('click', '.title', function (e) {
        $(this).parent().find('.itemMembers').toggle();
    });

    // Show an item related a current documentation automatically
    var filename = $('.page-title').data('filename').replace(/\.[a-z]+$/, '');
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

    // warn about outdated version
    var srcLinks = $('div.tag-source');
    var location = window.location.href;
    var branchSearch = location.match(/\/([^\/]*)\/apidoc\//);
    if (branchSearch && branchSearch.length) {
      var branch = branchSearch[1];
      if (branch !== 'latest') {
        if (/^v[0-9\.]*$/.test(branch)) {
          var ok = confirm('You are viewing outdated docs. Do you want to try the latest?');
          if (ok) {
            window.location.href = location.replace(branchSearch[0], '/latest/apidoc/');
          }
        } else {
          $('.package-version').text(branch);
        }
      }
    }

    // create source code links to github
    var version = $('.package-version');
    var branch = version.text();
    srcLinks.each(function(i, el) {
      var textParts = el.innerHTML.trim().split(', ');
      var link = 'https://github.com/openlayers/ol3/blob/' + branch + '/' +
          textParts[0];
      el.innerHTML = '<a href="' + link + '">' + textParts[0] + '</a>, ' +
          '<a href="' + link + textParts[1].replace('line ', '#l') + '">' +
          textParts[1] + '</a>';
    });

    // show/hide unstable items
    var links = $('a[href^="ol."]');
    var unstable = $('.unstable');
    var stabilityToggle = $('#stability-toggle');
    stabilityToggle.change(function() {
        unstable.toggleClass('hidden', this.checked);
        var search = this.checked ? '?stableonly=true' : '';
        links.each(function(i, el) {
            this.href = this.pathname + search + this.hash;
        });
        if (history.replaceState) {
            var url = window.location.pathname + search + window.location.hash;
            history.replaceState({}, '', url);
        }
        return false;
    });
    var search = window.location.search;
    links.each(function(i, el) {
        this.href = this.pathname + search + this.hash;
    });
    stabilityToggle.prop('checked', search === '?stableonly=true');
    unstable.toggleClass('hidden', stabilityToggle[0].checked);
});
