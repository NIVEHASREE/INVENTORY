import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('test_pdfkit.pdf');

pdf(dataBuffer).then(function (data) {
    console.log("TEXT EXTRACTED:");
    console.log(data.text);
}).catch(console.error);
