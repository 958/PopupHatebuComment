function getOptions(callback) {
    var default_options = { ShowInMouseOver: false, OverDelay: 500, MaxComments: 100, ShowNoComment: false };
    chrome.storage.local.get('options', function(data) {
        var options = data.options || default_options;
        if (!options['MaxComments'])
            options['MaxComments'] = default_options['MaxComments'];
        if (!options['OverDelay'])
            options['OverDelay'] = default_options['OverDelay'];
        callback(options);
    });
}

function saveOptions(options, callback) {
    chrome.storage.local.set({ options: options }, function() {
        if (callback) callback();
        hideCounter();
        if (!options.HideCounter) {
            initCounter();
        }
    });
}

chrome.runtime.onMessage.addListener(function(req, sender, res) {
    switch (req.action) {
        case 'link.load':
            try {
                var url = req.url.replace(/(^https?:\/\/b\.hatena\.ne\.jp\/entry\/)(.+$)/, function(s0, s1, s2) {
                    var result = s1 + 'jsonlite/';
                    if (s2.indexOf('s/') == 0) {
                        result += 'https://' + s2.replace('s/', '');
                    } else if (s2.indexOf('https://') != 0) {
                        result += 'https://' + s2;
                    } else {
                        result += s2;
                    }
                    return result;
                });
                requestEntry(url, sender, res);
            } catch (e) {
                var ret = { result: false, reason: e.description };
                res(ret);
            }
            break;
        case 'page.load':
            try {
                var url = 'https://b.hatena.ne.jp/entry/jsonlite/' + req.url;
                requestEntry(url, sender, res);
            } catch (e) {
                req.result = false;
                req.reason = e.description;
                res(req);
            }
            break;
        case 'options.get':
            getOptions(function(options) {
                res(options);
            });
            break;
        case 'options.save':
            saveOptions(req.options, function() {
                res({ success: true });
            });
            break;
    }
    return true;
});

function requestEntry(url, sender, res) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(data => {
            res({ result: true, content: data });
        })
        .catch(error => {
            res({ result: false, reason: error.message });
        });
}

function updateCounter(tabId) {
    chrome.tabs.get(tabId, function(tab) {
        tab.url = tab.url.replace(/#.+$/, '');
        if (/https?:\/\//.test(tab.url)) {
            const url = 'https://api.b.st-hatena.com/entry.count?url=' + encodeURIComponent(tab.url);
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.text();
                })
                .then(text => {
                    chrome.action.setBadgeText({ text: text, tabId: tab.id });
                })
                .catch(() => {
                    chrome.action.setBadgeText({ text: '', tabId: tab.id });
                });
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
    chrome.action.setBadgeText({ text: '' });
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
            window.tabs.forEach(function(tab) {
                chrome.action.setBadgeText({ text: '', tabId: tab.id });
            });
        });
    });
    chrome.tabs.onUpdated.removeListener(updateCounter);
}

function init() {
    getOptions(function(options) {
        if (!options.HideCounter) {
            initCounter();
        }
        chrome.action.setBadgeBackgroundColor({ color: '#009ad0' });
    });
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

