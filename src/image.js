const { Image, createCanvas, loadImage } = require('canvas')
var jpeg = require('jpeg-js');
var width = 320, height = 180;
var frameData = new Buffer.alloc(width * height * 4);
var i = 0;
while (i < frameData.length) {
  frameData[i++] = 0xFF; // red
  frameData[i++] = 0x00; // green
  frameData[i++] = 0x00; // blue
  frameData[i++] = 0xFF; // alpha - ignored in JPEGs
}
var rawImageData = {
  data: frameData,
  width: width,
  height: height
};
var jpegImageData = jpeg.encode(rawImageData, 100);
console.log(jpegImageData);
/*
const img = new Image()
img.onload = () => ctx.drawImage(img, 0, 0)
img.onerror = err => { throw err }
img.src = jpegImageData
*/
let t = require('fs').writeFile('Z.jpg', imagedata_to_image(jpegImageData), (err) => {
    if (err) throw err;
    //console.log(require('fs').readFileSync('NewFile.jpg'))
})

function imagedata_to_image(imagedata) {
    // create off-screen canvas element
    var canvas = createCanvas(200, 200),
        ctx = canvas.getContext('2d');

    // create imageData object
    var idata = ctx.createImageData(width, height);

    // set our buffer as source
    idata.data.set(frameData);

    // update canvas with new data
    ctx.putImageData(idata, 0, 0);
    canvas.toDataURL('image/jpeg', 1, (err, jpeg) => {console.log(jpeg) })
    var fs = require('fs');
    var string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
    var regex = /^data:.+\/(.+);base64,(.*)$/;

    var matches = string.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = new Buffer(data, 'base64');
    fs.writeFileSync('data.' + ext, buffer);
    return canvas.toDataURL
}