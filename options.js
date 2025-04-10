window.addEventListener('load', function(e){
    chrome.runtime.sendMessage({ action: 'options.get' }, function(options) {
        Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"]')).forEach(function(elm) {
            elm.checked = options[elm.id];
            elm.addEventListener('click', function(e){
                options[e.target.id] = e.target.checked;
                chrome.runtime.sendMessage({ action: 'options.save', options: options });
            }, false);
        });
        Array.prototype.slice.call(document.querySelectorAll('input[type="range"]')).forEach(function(elm) {
            elm.value = options[elm.id];
            var output = document.getElementById(elm.id + '_val');
            output.textContent = elm.value;
            elm.addEventListener('change', function(e){
                options[e.target.id] = e.target.value;
                output.textContent = e.target.value;
                chrome.runtime.sendMessage({ action: 'options.save', options: options });
            }, false);
        });
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

