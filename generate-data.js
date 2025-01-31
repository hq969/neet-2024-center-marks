const fs = require("fs");
const pdf = require("pdf-parse");
const download = require("download");

const json = JSON.parse(fs.readFileSync("neet-2024-centers-pretty.json", "utf8"));

// Generate centers data as CSV
function generateCentersData() {
    for (let i = 0; i < json.data.length; i++) {
        let e = json.data[i];
        let line = e.SrNo + ',"' + e.CENT_STATE + '","' + e.CENT_CITY + '","' + e.CENT_NAME + '",' + e.CENTNO;
        console.log(line);
    }
}

// Download PDFs for all centers sequentially
function downloadCenterPDFs() {
    let urls = [];
    for (let i = 0; i < json.data.length; i++) {
        let centno = json.data[i].CENTNO;
        let url = "https://neetfs.ntaonline.in/NEET_2024_Result/" + centno + ".pdf";
        urls.push(url);
    }
    (async () => {
        for (let i = 0; i < urls.length; i++) {
            await download(urls[i], "pdfs");
        }
    })();
}

// Generate center longnames found in PDFs as CSV
function generateCenterLongnames() {
    for (let i = 0; i < json.data.length; i++) {
        let centno = json.data[i].CENTNO;
        let filename = "./pdfs/" + centno + ".pdf";
        let dataBuffer = fs.readFileSync(filename);
        pdf(dataBuffer).then(function (data) {
            let lines = data.text.split("\n");
            let parse = false;
            let csv = "";
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.startsWith("Page No.")) {
                    parse = true;
                    continue;
                }
                if (parse) {
                    csv = centno + ',"' + line + '"\n';
                    break;
                }
            }
            process.stdout.write(csv);
        });
    }
}

// Generate center-wise marks from each center specific PDF as CSV
function generateCenterMarks() {
    for (let i = 0; i < 1; i++) {
    //for (let i = 0; i < json.data.length; i++) {
        let centno = json.data[i].CENTNO;
        let filename = "./pdfs/" + centno + ".pdf";
        let dataBuffer = fs.readFileSync(filename);
        pdf(dataBuffer).then(function (data) {
            let lines = data.text.split("\n");
            let parse = false;
            let c = 1;
            let csv = "";
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.startsWith("Srlno.  Marks")) {
                    parse = true;
                    continue;
                } else if (line.startsWith("Centre:")) {
                    parse = false;
                    c = 1;
                    continue;
                }
                if (line.trim().length == 0) {
                    continue;
                }
                if (parse) {
                    if (c % 2 == 0) {
                        csv += "," + parseInt(line) + "\n";
                    } else {
                        csv += centno + "," + parseInt(line);
                    }
                    c++;
                }
            }
            process.stdout.write(csv);
        });
    }
}

// Uncomment and run as 'node generate-data.js > csv/neet-2024-centers.csv'
//generateCentersData();

// Uncomment to download all center-wise PDFs to pdfs folder
//downloadCenterPDFs();

// Uncomment and run as 'node generate-data.js > csv/neet-2024-center-longnames.csv'
//generateCenterLongnames();

// Uncomment and run as 'node generate-data.js > csv/neet-2024-centers.csv'
//generateCenterMarks();
