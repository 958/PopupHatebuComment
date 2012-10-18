window.addEventListener('load', function(e){
    var bg = chrome.extension.getBackgroundPage();
    Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"]')).forEach(function(elm) {
        elm.checked = bg.options[elm.id];
        elm.addEventListener('click', function(e){
            bg.options[e.target.id] = e.target.checked;
            bg.saveOptions();
        }, false);
    });
    Array.prototype.slice.call(document.querySelectorAll('input[type="range"]')).forEach(function(elm) {
        elm.value = bg.options[elm.id];
        var output = document.getElementById(elm.id + '_val');
        output.textContent = elm.value;
        elm.addEventListener('change', function(e){
            bg.options[e.target.id] = e.target.value;
            output.textContent = e.target.value;
            bg.saveOptions();
        }, false);
    });

    var over = document.getElementById('ShowInMouseOver');
    var overDelayUpdate = function (){
        if (over.checked) {
            document.getElementById('OverDelay').disabled = false;
        } else {
            document.getElementById('OverDelay').disabled = true;
        }
    }
    over.addEventListener('click', overDelayUpdate, false);
    overDelayUpdate();
}, false);

