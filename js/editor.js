var defTextarea = document.getElementById("definitions");

var editor = CodeMirror.fromTextArea(defTextarea, {
    mode: "scheme",
    theme: "base16-ocean-dark",
    tabSize: 2,
    lineWrapping: true,
    lineNumbers: true,
    showCursorWhenSelecting: true,
    autofocus: false,
    matchBrackets: true,
    autoCloseBrackets: true
});

editor.setOption("extraKeys", {
    // tab is evil!
    Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" "); 
        cm.replaceSelection(spaces);
    }
});


