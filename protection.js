(function () {
  function stopDefault(event) {
    event.preventDefault();
    return false;
  }

  var style = document.createElement('style');
  style.textContent = [
    'body {',
    '  -webkit-user-select: none;',
    '  -moz-user-select: none;',
    '  -ms-user-select: none;',
    '  user-select: none;',
    '}',
    'input, textarea, [contenteditable="true"] {',
    '  -webkit-user-select: text;',
    '  -moz-user-select: text;',
    '  -ms-user-select: text;',
    '  user-select: text;',
    '}',
    'img {',
    '  -webkit-user-drag: none;',
    '  user-drag: none;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  document.addEventListener('contextmenu', stopDefault);
  document.addEventListener('copy', stopDefault);
  document.addEventListener('cut', stopDefault);
  document.addEventListener('dragstart', stopDefault);
  document.addEventListener('selectstart', function (event) {
    var target = event.target;
    if (!target) return stopDefault(event);
    if (target.closest('input, textarea, [contenteditable="true"]')) return true;
    return stopDefault(event);
  });
})();
