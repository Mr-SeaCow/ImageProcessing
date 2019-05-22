const fs = require('fs');
const jpeg = require('jpeg-js')
const { createCanvas } = require('canvas')
const imageClass = require('./imageClass')
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

function pairRGBA(data, dFile, options) {
    let tempArr = []
    let countRow = dFile.width;
    let currentRow = 0;
    let tempRow = [];
    for (let i = 0; i < data.length + 4; i = i + 4) {
        if (countRow == dFile.width) {
            countRow = 0;
            currentRow++;
            tempArr.push(tempRow);
            tempRow = [];
        }
        countRow++
        let tempData = { 'R': data[i], 'G': data[i + 1], 'B': data[i + 2], 'A': data[i + 3] };
        if (options.grayscale) {
            tempData = grayScale(tempData);
        }
        if (options.contrast) {
            tempData = contrast(tempData, options.contrast);
        }
        if (options.brightness) {
            tempData = brightness(tempData, options.brightness);
        }
        if (options.inverse) {
            tempData = inverse(tempData)
        }
        tempRow.push(tempData)
    }
    return tempArr
}

function flattenRGBA(data) {
    let tempArr = [];
    for (let i = 0; i < data.length; i++) {
        let row = data[i]
        for (let r = 0; r < row.length; r++) {
            let d = row[r]
            tempArr.push(hex(d.R), hex(d.G), hex(d.B), hex(d.A))
        }
    }
    return tempArr;
}

function hex(d) {
    return ('0x' + d.toString(16).toUpperCase())
}

function brightness(obj, value) {
    let { R, G, B, A } = obj;
    R = (R + value).clamp(0, 255)
    G = (G + value).clamp(0, 255)
    B = (B + value).clamp(0, 255)
    return { R, G, B, A }
}

function grayScale(obj) {
    let { R, G, B, A } = obj;
    let avg = Math.round((R + G + B) / 3);
    R = avg;
    G = avg;
    B = avg;
    return { R, G, B, A }
}

function inverse(obj) {
    let { R, G, B, A } = obj;
    let arr = [R, G, B]
    let mid = 122.5
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 122.5) {
            let d = arr[i] - mid
            arr[i] = mid - d
        } else {
            let d = mid - arr[i]
            arr[i] = mid + d
        }
    }
    R = arr[0];
    G = arr[1];
    B = arr[2];
    return { R, G, B, A }
}

function contrast(obj, differences) {
    let { R, G, B, A } = obj;
    let arr = [R, G, B]
    let contrastCodex = [] //choosable numbers
    for (let i = 0; i < differences + 1; i++) {
        contrastCodex.push((255 / differences) * i)
    }
    for (let i = 0; i < 3; i++) {
        let val = arr[i]
        if (val !== contrastCodex[0] && val !== contrastCodex[contrastCodex.length - 1]) {
            for (let j = 0; j < differences; j++) {
                let op1 = contrastCodex[j];
                let op2 = contrastCodex[j + 1];
                if (isBetween(val, op1, op2)) {
                    if (j == 0) {
                        arr[i] = Math.round(op1);
                        break;
                    }
                    if (j == differences - 1) {
                        arr[i] = Math.round(op2);
                        break;
                    }

                    arr[i] = Math.round((op1 + op2) / 2)
                }
            }
        }
    }
    return { R: arr[0], G: arr[1], B: arr[2], A }
}

function isBetween(val, op1, op2) {
    if (op1 <= val && val <= op2) {
        return true;
    }
    return false
}

function encodeData(arr, dFile) {
    let { width, height } = dFile

    let encodedBuffer = new Buffer.from(arr);
    //console.log(encodedBuffer)
    /*
    let i = 0;
    for (let i = 0; i < arr.length; i++) {
        encodedBuffer[i] = arr[i];
    }
    *//*
    let imageData = {
        data: encodedBuffer,
        width,
        height
    }
    let file = jpeg.encode(imageData, 100);
    let t = fs.writeFile('NewFile.jpg', JSON.stringify(file), (err) => {
        if (err) throw err;
        console.log(fs.readFileSync('NewFile.jpg'))
    })
    */
    return imagedata_to_image(encodedBuffer, width, height)
}

function imagedata_to_image(imagedata, width, height) {
    // create off-screen canvas element
    var canvas = createCanvas(width, height),
        ctx = canvas.getContext('2d');

    // create imageData object
    var idata = ctx.createImageData(width, height);

    // set our buffer as source
    idata.data.set(imagedata);

    // update canvas with new data
    ctx.putImageData(idata, 0, 0);
    let dataUrl = canvas.toDataURL('image/jpeg', 1)
    var string = dataUrl;
    var regex = /^data:.+\/(.+);base64,(.*)$/;

    var matches = string.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = new Buffer(data, 'base64');
    fs.writeFileSync('data.' + ext, buffer);
    return buffer
}


function toAsciiArt(data, turningPoint = "120") {
    let string = ''
    for (let i = 0; i < data.length; i++) {
        let row = data[i]
        string = string + '\n'
        for (let r = 0; r < row.length; r++) {
            let d = row[r]
            //tempArr.push(hex(d.R), hex(d.G), hex(d.B), hex(d.A))
            if (d.R > turningPoint) {
                string = string + '#'
            } else {
                string = string + ' '
            }
        }
    }
    fs.writeFileSync('test.txt', string)
    return string
}

module.exports = (file, options, callback) => {

    let decFile = jpeg.decode(file)
    let imageData = decFile.data.toJSON()


    /*    -----------
    *     | OPTIONS |
    *     -----------
    *   GrayScale = true
    *   Contrast = difference 3/255
    *   Brightness = (-255)/255
    */
    if (options.scale) {
        let {w, h} = options.scale;
        let pairedImageArr = pairRGBA(imageData.data, decFile, options);
        pairedImageArr.shift();
        let img = new imageClass(pairedImageArr)
        img.scale('bilinear', { w, h }, (x) => {
            //require("./imageScaling")(pairedImageArr, 'bilinear')
            let returnObj = {}
            //console.log('decFile', decFile)

            decFile.width = w;
            decFile.height = h;

            returnObj.img = encodeData(flattenRGBA(x), decFile)
            callback(returnObj)
        })
    }
    /*
    let returnObj = {}
    if (options.ascii) {
        returnObj.ascii = toAsciiArt(pairedImageArr, 220)
    }
    require("./imageScaling")(pairedImageArr)
    returnObj.img = encodeData(flattenRGBA(pairedImageArr), decFile)
    callback(returnObj)
    */
}


/*
let t = pairRGBA(imageData.data)
toAsciiArt(t)
//console.log(t)
//console.log(contrast({ R: 108, G: 108, B: 108, A: 255 }, 2))
encodeData(flattenRGBA(t));
*/
