const fs = require('fs');
const imageClass = require('./src/imageClass');
const startT = Date.now();
let image = new imageClass(fs.readFileSync('./images/Cow Logo.jpg'));
image.scale('bilinear', {w: 1125, h:  1125}, 1.2, (img, ext) => {
    fs.writeFileSync('bilinear.' + ext, img);
    console.log(`Bilinear process took ${(Date.now() - startT)/1000} seconds to complete.`)
})
let image2  = new imageClass(fs.readFileSync('./images/Cow Logo.jpg'));

image2.scale('bicubic', {w: 1125, h:  1125}, 2, (img, ext) => {
    fs.writeFileSync('bicubic.' + ext, img);
    console.log(`Bicubic process took ${(Date.now() - startT)/1000} seconds to complete.`)
})

//node --max-old-space-size=16384 index.js

