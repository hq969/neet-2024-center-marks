// Based on the sql.js GUI example at:
// https://github.com/sql-js/sql.js/blob/master/examples/GUI/gui.js

var execBtn = document.getElementById("execute");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var commandsElm = document.getElementById('commands');

// Start the worker in which sql.js will run
var worker = new Worker("js/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: 'open' });

// Connect to the HTML element we 'print' to
function print(text) {
    outputElm.innerHTML = text.replace(/\n/g, '<br>');
}

function error(e) {
    console.log(e);
    errorElm.style.height = '2em';
    errorElm.textContent = e.message;
}

function noerror() {
    errorElm.style.height = '0';
}

// Run a command in the database
function execute(commands) {
    worker.onmessage = function (event) {
        var results = event.data.results;
        if (!results) {
            error({ message: event.data.error });
            return;
        }
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
    }
    worker.postMessage({ action: 'exec', sql: commands });
    outputElm.textContent = "Fetching results...";
}

// Create an HTML table
var tableCreate = function () {
    function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        var open = '<' + tagName + '>', close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
    }
    return function (columns, values) {
        var tbl = document.createElement('table');
        tbl.setAttribute("class", "table table-info table-striped table-bordered border-primary");
        var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        var rows = values.map(function (v) { return valconcat(v, 'td'); });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        tbl.innerHTML = html;
        return tbl;
    }
}();

// Execute the commands when the button is clicked
function execEditorContents() {
    noerror()
    execute(editor.getValue() + ';');
}
execBtn.addEventListener("click", execEditorContents, true);

// Add syntax highlihjting to the textarea
var editor = CodeMirror.fromTextArea(commandsElm, {
    mode: 'text/x-mysql',
    viewportMargin: Infinity,
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets: true,
    autofocus: true,
    extraKeys: {
        "Ctrl-Enter": execEditorContents,
    }
});

// Fetch the database
async function fetchDB(){
    const [buf] = await Promise.all([
        fetch("db/neet-2024-center-marks-data.db").then(res => res.arrayBuffer())
    ]);
    worker.onmessage = function () {
        // Show the schema of the loaded database
        editor.setValue("SELECT `name`, `sql` FROM `sqlite_master` WHERE type='table';\n" +
            "SELECT * FROM centers LIMIT 5;\n" + 
            "SELECT count() AS 'No of Centers' FROM centers;\n" +
            "SELECT * FROM center_longnames LIMIT 5;\n" +
            "SELECT * FROM center_marks LIMIT 5;\n" +
            "SELECT count() AS 'No of Students' FROM center_marks;\n"
        );
        execEditorContents();
    };
    try {
        worker.postMessage({ action: 'open', buffer: buf }, [buf]);
    }
    catch (exception) {
        worker.postMessage({ action: 'open', buffer: buf });
    }
}

fetchDB();
