const path = require('path');
const fs = require('fs');
const directoryPath = path.join(__dirname, '../fotograflar');

fs.readdir(directoryPath, (err, files) => {
    if (err) { return console.log('Unable to scan directory: ' + err); }

    fs.writeFile('PHOTOS.txt', '', (err) => { console.log(err ? err : "Success!") });

    files.forEach(function (file) {

        fs.appendFile("PHOTOS.txt", file + ",", (err) => { console.log(err ? err : "Success!") });

    });
});