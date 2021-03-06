var default_options = { ShowInMouseOver: false, OverDelay: 500, MaxComments: 100, ShowNoComment: false };
var options = default_options;
if (localStorage.options) {
    options = JSON.parse(localStorage.options);
    if (!options['MaxComments'])
        options['MaxComments'] = default_options['MaxComments']
    if (!options['OverDelay'])
        options['OverDelay'] = default_options['OverDelay']
}

function requestEntry(url, sender, res) {
    var ret = { };
    var http = new XMLHttpRequest();
    http.open('GET', url, true);
    http.onload = function(){
        if(http.status != 200){ return http.onerror(http.statusText) }
        ret.result = true;
        ret.content = JSON.parse(http.responseText);
        res(ret);
    };
    http.onerror = function(e){
        ret.result = false;
        ret.reason = e;
        res(ret);
    };
    http.send(null);
}

chrome.extension.onRequest.addListener(function(req, sender, res) {
    switch (req.action) {
    case 'link.load':
        try{
            var url = req.url.replace(/(^http:\/\/b\.hatena\.ne\.jp\/entry\/)(.+$)/, function(s0, s1, s2) {
                var result = s1 + 'jsonlite/';
                if (s2.indexOf('s/') == 0) {
                    result += 'https://' + s2.replace('s/', '');
                } else if (s2.indexOf('http://') != 0) {
                    result += 'http://' + s2;
                } else {
                    result += s2;
                }
                return result;
            });
            requestEntry(url, sender, res);
        } catch(e) {
            var ret = { result: false, reason: e.description };
            res(ret);
        }
        break;
    case 'page.load':
        try{
            var url = 'http://b.hatena.ne.jp/entry/jsonlite/' + req.url;
            requestEntry(url, sender, res);
        } catch(e) {
            req.result = false;
            req.reason = e.description;
            res(req);
        }
        break;
    case 'options.get':
        res(options);
        break;
    }
});

//chrome.browserAction.setBadgeBackgroundColor({ color: [0, 96, 255, 200] });

//var counterCaches = {};
function updateCounter(tabId) {
    chrome.tabs.get(tabId, function(tab) {
        tab.url = tab.url.replace(/#.+$/, '');
        if (/http:\/\//.test(tab.url)) {
            chrome.pageAction.show(tab.id);
//          if (!counterCaches[tab.url]) {
                var http = new XMLHttpRequest();
                http.open('GET', 'http://api.b.st-hatena.com/entry.count?url=' + encodeURIComponent(tab.url), true);
                http.onload = function(res){
                    if(http.status != 200){ return http.onerror(http.statusText) }
//                  counterCaches[tab.url] = http.responseText;
//                  chrome.browserAction.setBadgeText({ text: http.responseText, tabId: tab.id });
                    chrome.pageAction.setTitle({ title: (http.responseText != '') ? http.responseText + ' users' : '', tabId: tab.id });
                };
                http.onerror = function(e){
//                  counterCaches[tab.url] = '';
//                  chrome.browserAction.setBadgeText({ text: '', tabId: tab.id });
                    chrome.pageAction.setTitle({ title: 'error', tabId: tab.id });
                };
                http.send(null);
//          } else {
//              chrome.browserAction.setBadgeText({ text: couterCache[tab.url], tabId: tab.id });
//          }
        } else if (/https:\/\//.test(tab.url)) {
//          chrome.browserAction.setBadgeText({ text: '?', tabId: tab.id });
            chrome.pageAction.show(tab.id);
            chrome.pageAction.setTitle({ title: '', tabId: tab.id });
        }
    });
}

function initCounter() {
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
            window.tabs.forEach(function(tab) {
                updateCounter(tab.id);
            });
        });
    });

    chrome.tabs.onUpdated.addListener(updateCounter);
}

function hideCounter(){
//  chrome.browserAction.setBadgeText({ text: '' });
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
            window.tabs.forEach(function(tab) {
//              chrome.browserAction.setBadgeText({ text: '', tabId: tab.id });
                chrome.pageAction.hide(tab.id);
            });
        });
    });
    chrome.tabs.onUpdated.removeListener(updateCounter);
}
if (!options.HideCounter) {
    initCounter();
}
function saveOptions(){
    localStorage.options = JSON.stringify(options);
    if (options.HideCounter) {
        hideCounter();
    } else {
        initCounter();
    }
}
