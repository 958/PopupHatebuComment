(function(){
    var options = {};
    chrome.extension.sendRequest(
        {
            action: 'options.get'
        },
        function(res) {
            options = res;
            init();
        }
    );

    function HatebuComments(elm) {
        this._init(elm);
    }
    HatebuComments.prototype = {
        _init: function(elm) {
            if (elm.isShow) return;
            elm.isShow = true;

            this.target = elm;
            this.container = document.createElement('div');
            this.container.className = '__popup_hatebu_comment_container __popup_hatebu_comment_loading';
            this.content = document.createElement('ul');
            this.container.appendChild(this.content);
            var pos = rect(elm);
            this.container.style.top = pos.top + 'px';
            this.container.style.left = pos.left + 'px';
            document.body.appendChild(this.container);
            this._request(elm.href);
        },
        _request: function(url) {
            var self = this;
            chrome.extension.sendRequest({
                action: 'link.load',
                url: url
            }, function(res){
                if (res.result)
                    self._load(res);
                else {
                    self.hide();
                }
            });
        },
        _load: function(res) {
            var json = res.content;
            if (!json) {
                this.hide();
                return;
            }

            var bm = json.bookmarks;
            if (!bm) {
                this.hide();
                return;
            }
            var html = [];
            for (var i = 0, l = bm.length, cnt = 0; i < l && cnt < options['MaxComments']; i++) {
                var user = bm[i];
                var name = user.user;
                var date = getDate(new Date(user.timestamp));
                if (!options['ShowNoComment'] && user.comment == '') continue;
                html.push([
                    '<li class="__popup_hatebu_comment_user"><img class="__popup_hatebu_comment_icon" src="http://www.hatena.ne.jp/users/', name.substring(0,2), '/', name, '/profile_s.gif">',
                    '<a class="__popup_hatebu_comment_name" href="http://b.hatena.ne.jp/', name, '/', date, '#bookmark-', json.eid, '">', name, '</a>',
                    '<span class="__popup_hatebu_comment_tags">',
                    (function(tags){
                        var ret = [];
                        for (var i = 0, l = tags.length; i < l; i++)
                            ret.push(['<a href="http://b.hatena.ne.jp/', name, '/', tags[i], '/">', tags[i], '</a>'].join(''));
                        return ret.join(', ');
                    })(user.tags),
                    '</span>', this.toUrlLink(user.comment), '</li>'
                ].join(''));
                cnt++;
            }
            this.content.innerHTML = html.join('');
            var entryPage = document.createElement('a');
            entryPage.href = this.target.href;
            entryPage.target = '_blank';
            entryPage.innerHTML = '<img src="http://b.hatena.ne.jp/entry/image/' + json.url + '">';
            entryPage.className = '__popup_hatebu_comment_hatebu_entry_page_link';
            this.container.insertBefore(entryPage, this.content);

            var self = this;
            if (!options['ShowInMouseOver']) {
                var closeButton = document.createElement('a');
                closeButton.href = '#';
                closeButton.className = '__popup_hatebu_comment_close';
                this.container.insertBefore(closeButton, this.content);

                closeButton.addEventListener('click', function(e){
                    self.hide();
                    e.preventDefault();
                });
            } else {
                this.container.addEventListener('mouseout', function(e) {
                    var over = false;
                    var elm = e.toElement;
                    while (elm) {
                        if (elm == self.container) {
                            over = true;
                            break;
                        }
                        elm = elm.parentNode;
                    }
                    if (!over)
                        self.hide();
                }, false);
            }
            this.container.className = '__popup_hatebu_comment_container';

            var pos = rect(this.container);
            var page = pageRect();
            if (pos.right > page.right)
                pos.left = page.right - this.container.clientWidth - 20;
            if (pos.bottom > page.bottom)
                pos.top = page.bottom - this.container.clientHeight - 20;
            this.container.style.top = pos.top + 'px';
            this.container.style.left = pos.left + 'px';

        },
        hide: function(){
            document.body.removeChild(this.container);
            this.target.isShow = false;
        },
        _httpRegexp: /(.*?)((?:https?):\/\/(?:[A-Za-z0-9~\/._?=\-%#+:;,@\']|&(?!lt;|gt;|quot;))+)(.*)/,
        toUrlLink: function(str){
            if (this._httpRegexp.test(str)) {
                var self = this;
                var matches = [];
                var match;
                while (str && (match = self._httpRegexp.exec(str))) {
                    matches.push(match[1]);
                    matches.push(match[2]);
                    str = match[3] || '';
                }
                if (str) matches.push(str);
                var result = [];
                matches.forEach(function(match) {
                    if (self._httpRegexp.test(match)) {
                        result.push('<a href="' + match + '" target="_blank">' + match + '</a>');
                    } else {
                        result.push(match);
                    }
                });
                str = result.join('');
            }
            return str;
        }
    };

    function getDate(date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        if (m < 10) m = "0" + m;
        if (d < 10) d = "0" + d;
        return y + m + d;
    }

    function rect(elem) {
        var left = 0, top = 0, results;
        var box = elem.getBoundingClientRect();
        return {
            left: box.left + document.body.scrollLeft,
            top: box.top  + document.body.scrollTop,
            right: box.right + document.body.scrollLeft,
            bottom: box.bottom + document.body.scrollTop
        };
    }

    function pageRect() {
        var _body = (document.compatMode == "CSS1Compat") ? document.documentElement : document.body;
        var box = {
            left  : _body.scrollLeft,
            top   : _body.scrollTop,
            right : document.body.scrollLeft + _body.clientWidth,
            bottom: document.body.scrollTop + _body.clientHeight
        }
        return box;
    }
    function init(){
        if (!options['ShowInMouseOver']) {
            document.body.addEventListener('click', function(e){
                if (!e.ctrlKey) return;
                var target = e.target;
                while (target && target.nodeName != 'A' && target.nodeName != 'HTML')
                    target = target.parentElement;
                if (target && target.nodeName == 'A' && target.href && target.className.indexOf('__popup_hatebu_comment_hatebu_entry_page_link') == -1 && /^http:\/\/b\.hatena\.ne\.jp\/entry\/.+/.test(target.href)){
                    new HatebuComments(target);
                    e.preventDefault();
                }
            }, false);
        } else {
            var timer = null;
            document.body.addEventListener('mouseover', function(e){
                var target = e.target;
                while (target && target.nodeName != 'A' && target.nodeName != 'HTML')
                    target = target.parentElement;
                if (target && target.nodeName == 'A' && target.href && target.className.indexOf('__popup_hatebu_comment_hatebu_entry_page_link') == -1 && /^http:\/\/b\.hatena\.ne\.jp\/entry\/.+/.test(target.href)){
                    target.isOver = true;
                    timer = setTimeout(function(){
                        delete target.isOver;
                        new HatebuComments(target);
                    }, options['OverDelay']);
                }
            }, false);
            document.body.addEventListener('mouseout', function(e){
                var target = e.target;
                while (target && target.nodeName != 'A' && target.nodeName != 'HTML')
                    target = target.parentElement;
                if (target && target.nodeName == 'A' && target.href && target.className.indexOf('__popup_hatebu_comment_hatebu_entry_page_link') == -1 && /^http:\/\/b\.hatena\.ne\.jp\/entry\/.+/.test(target.href)){
                    if (target.isOver == true) {
                        delete target.isOver;
                        clearTimeout(timer);
                    }
                }
            }, false);
        }
    }
})();
