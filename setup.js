const fs = require('fs');
const { exec } = require("child_process");

function updateAppVersion() {
    // Update version to today's date
    
    const packageJson = fs.readFileSync('package.json', 'utf-8');
    const packageData = JSON.parse(packageJson);

    const currentDate = new Date();
    const dateSplit = currentDate.toISOString().split('T') //split into date (0) and time (1)
    const formattedDate = dateSplit[0].replace(/-/g, '.');

    packageData.version = formattedDate + '.' + secondsSinceDayStart();

    fs.writeFileSync('package.json', JSON.stringify(packageData, null, 2));

    console.log('[BuildSetup] Package version updated to:', packageData.version);
}

function secondsSinceDayStart() {
    // used to help generate build version, making the ending hash
    // always increase in value throughout the day
    const dateStr = new Date().toDateString();
    const dayBegin = new Date(dateStr).valueOf();
    const now = new Date().valueOf();
    const sinceDayStartSec = parseInt((now-dayBegin)/1000);
    return sinceDayStartSec.toString().padStart(5,'0');
}

function generateAssetBundles() {
    // Generate icons depending on the environment

    let cmd = 'npx pwa-asset-generator ./src/assets/icons/ ./src/assets/icons -m ./src/manifest.webmanifest -i ./src/index.html --type png --mstile --opaque true';
    let cmd2 = 'npx pwa-asset-generator ./src/assets/icons/ ./src/assets/icons -m ./src/manifest.webmanifest -i ./src/index.html --type png -p 30% --splash-only true'

    switch(process.argv[2]){
        case 'dev':
            cmd = cmd.substring(0, 43) + 'icon-dev.png' + cmd.substring(43);
            cmd2 = cmd2.substring(0, 43) + 'icon-dev.png' + cmd2.substring(43);
            break;
        case 'test':
            cmd = cmd.substring(0, 43) + 'icon-test.png' + cmd.substring(43);
            cmd2 = cmd2.substring(0, 43) + 'icon-test.png' + cmd2.substring(43);
            break;
        case 'prod':
            cmd = cmd.substring(0, 43) + 'icon-prod.png' + cmd.substring(43);
            cmd2 = cmd2.substring(0, 43) + 'icon-prod.png' + cmd2.substring(43);
            break;
        case 'local':
            cmd = cmd.substring(0, 43) + 'icon-local.png' + cmd.substring(43);
            cmd2 = cmd2.substring(0, 43) + 'icon-local.png' + cmd2.substring(43);
            break;
        default:
            cmd = cmd.substring(0, 43) + 'icon-unknown.png' + cmd.substring(43);
            cmd2 = cmd2.substring(0, 43) + 'icon-unknown.png' + cmd2.substring(43);
    }

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
        console.error();
        console.error("Error:");
        console.error(err);
        console.error();
        }
        console.log(stdout);
        console.error(stderr);
    });
    console.log('[BuildSetup] Generation of generalized transparent icos complete')
    exec(cmd2, (err, stdout, stderr) => {
        if (err) {
        console.error();
        console.error("Error:");
        console.error(err);
        console.error();
        }
        console.log(stdout);
        console.error(stderr);
    });
    console.log('[BuildSetup] Generation of iOS splash screens complete');
}


function updateManifest() {
    const manifestFile = fs.readFileSync('./src/manifest.webmanifest', 'utf-8');
    const manifestData = JSON.parse(manifestFile);
    const environment = process.argv[2];
    if (environment == 'prod') {
        manifestData.name = 'Field Inspections - Prod';
        manifestData.short_name = 'Field Inspections';
    } else {
        manifestData.name = `Field Inspections - ${environment}`
        manifestData.short_name = `Field Inspections - ${environment}`;
    }

    fs.writeFileSync('./src/manifest.webmanifest', JSON.stringify(manifestData, null, 2));
    console.log(`[BuildSetup] Modified WebManifest Naming - ${manifestData.name}`)
    
}

console.log('[BuildSetup] ---------------------------');
console.log('[BuildSetup] Start custom build script');
console.log('[BuildSetup] ---------------------------');
updateAppVersion();
generateAssetBundles();
updateManifest();
console.log('[BuildSetup] ---------------------------');
console.log('[BuildSetup] End custom build script');
console.log('[BuildSetup] ---------------------------');