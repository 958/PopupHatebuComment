function getDate(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    if (m < 10) m = "0" + m;
    if (d < 10) d = "0" + d;
    return y + m + d;
}

var options = {};
chrome.runtime.sendMessage(
    {
        action: 'options.get'
    },
    function(res) {
        options = res;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
            var tab = tabs[0];
            if (/https?:\/\//.test(tab.url)) {
                new HatebuComments(tab.url);
            } else {
                window.close();
            }
        });
    }
);

function HatebuComments(url) {
    this._init(url);
}
HatebuComments.prototype = {
    _init: function(url) {
        this.container = document.getElementsByTagName('body')[0];
        this.container.className = '__popup_hatebu_comment_container __popup_hatebu_comment_loading';
        this.content = document.createElement('ul');
        this.container.appendChild(this.content);
        this.url = url;
        this._request();
    },
    _request: function() {
        var self = this;
        chrome.runtime.sendMessage({
            action: 'page.load',
            url: self.url
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
        entryPage.href = 'http://b.hatena.ne.jp/entry/' + this.url;
        entryPage.target = '_blank';
        entryPage.innerHTML = '<img src="http://b.hatena.ne.jp/entry/image/' + json.url + '">';
        entryPage.className = '__popup_hatebu_comment_hatebu_entry_page_link';
        this.container.insertBefore(entryPage, this.content);

        this.container.className = '__popup_hatebu_comment_container';
    },
    hide: function(){
        window.close();
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

