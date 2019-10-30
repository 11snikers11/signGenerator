const puppeteer     = require('puppeteer');
const express       = require('express');
const app           = express();
const path          = require('path');
const moment        = require('moment');
const crypto        = require('crypto');
const pug           = require('pug');

const compiledFunction = pug.compileFile(path.join(__dirname, '/template/signTemplate.pug'));
const serverConfig = require('./config.json');

function returnCompiledHtmlTemplate(action, whoSigned, signDate, md5) {
    return compiledFunction({
        "action": action,
        "whoSigned": whoSigned,
        "signDate": signDate,
        "md5": md5
    });
}

let port = serverConfig.serverPort;

function todayDate(date) {
    return moment(date).format("DD.MM.YYYY HH:mm");
}

function returnMd5Hash(whoSigned, todayDate) {
    return crypto.createHash('md5').update(whoSigned + todayDate).digest("hex");
}

async function makeScreen(signName, action, date) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const pathToSave = path.join(__dirname, `/generated images/${signName}.png`);
    const htmlForScreenshot = returnCompiledHtmlTemplate(action, signName, todayDate(date), returnMd5Hash(signName, todayDate(date)));
    await page.setContent(htmlForScreenshot);
    await page.screenshot(
        {
            path: pathToSave,
            clip: { x: 0, y: 0, width: 254, height: 104 }
        }    
    );
    await browser.close();
}

app.get('/createImage', async function(req, res) {
    const signName = req.query.name;
    const action = req.query.action.toUpperCase();
    const date = req.query.date;
    await makeScreen(signName, action, date);
    res.download(path.join(__dirname, `/generated images/${signName}.png`));
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'form.html'));
});

app.listen(port, () => {
    console.log(`your app on http://localhost:${port}`);
});