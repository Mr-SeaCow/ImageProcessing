const fs = require('fs');
const jpeg = require('jpeg-js');
const { createCanvas } = require('canvas');
const cubicClass = require('./src/cubicInterpClass');

Number.prototype.clamp = function (min = 0, max = 255) {
    return Math.min(Math.max(this, min), max);
};

class image {

    constructor(img) {
        this._RGB = ['R', 'G', 'B', 'A'];
        this._newImageMatrix = [];
        fs.writeFileSync('img.json', JSON.stringify(img.toJSON()))
        this._decFile = jpeg.decode(img);
        this.initialize(this._decFile);
        this._bicubicObj = { R: [], G: [], B: [], A: [] };
    }

    initialize(decFile) {
        let imageData = decFile.data.toJSON();
        this.pairRGBA(imageData.data, decFile);
    }

    set imageMatrix(x) {
        this._imageMatrix = x;
        this._imageMatrix.shift();
    }

    get imageMatrix() {
        return this._imageMatrix;
    }

    pairRGBA(data, dFile) {

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
            tempRow.push(tempData);
        }
        tempArr.shift();
        this._imageMatrix = tempArr;
        this._width = this._imageMatrix[0].length;
        this._height = this._imageMatrix.length;
    }

    flattenRGBA(data) {
        let tempArr = [];
        for (let i = 0; i < data.length; i++) {
            let row = data[i]
            for (let r = 0; r < row.length; r++) {
                let d = row[r]
                tempArr.push(this.hex(d.R), this.hex(d.G), this.hex(d.B), this.hex(d.A))
            }
        }
        return tempArr;
    }

    hex(d) {
        return ('0x' + d.toString(16).toUpperCase())
    }

    accessArray(x, y) {
        let nY = y;
        let nX = x;
        if (!this._imageMatrix[nY]) {
            nY--
        }

        if (!this._imageMatrix[nY][nX]) {
            nX--
        }


        return this._imageMatrix[nY][nX];
    }

    accessBicubicVals(x, y, z) {
        return this._bicubicObj[z][y][x]
    }

    RGBToPercent(x) {
        return x / 255
    }

    PercentToRGB(x) {
        return Math.round(x * 255);
    }

    scale(t, a, scale, c) {
        switch (t) {
            case 'bicubic': {
                let curWidth = this._width;
                let curHeight = this._height;
                if (curWidth * scale < a.w || curHeight * scale < a.h) {
                    let cW = Math.floor(curWidth * scale < a.w ? curWidth * scale : a.w)
                    let cH = Math.floor(curHeight * scale < a.w ? curHeight * scale : a.h)
                    this._imageMatrix = this.bicubic(this.iterationValues(curWidth, curHeight, cW, cH));
                    this._width = cW;
                    this._height = cH;
                    console.log('a')
                    this._bicubicObj = {R: [], G: [], B: [], A: []};
                    this.scale(t, a, scale, c)
                } else {
                    this._imageMatrix = this.bicubic(this.iterationValues(curWidth, curHeight, a.w, a.h));
                    this._decFile.width = a.w;
                    this._decFile.height = a.h;
                    let o = this.encodeData(this.flattenRGBA(this._imageMatrix), this._decFile)
                    c(o.img, o.ext);

              }
                break;
            }
            case 'bilinear': {
                let curWidth = this._width;
                let curHeight = this._height;
                if (curWidth * scale < a.w || curHeight * scale < a.h) {
                    let cW = Math.floor(curWidth * scale < a.w ? curWidth * scale : a.w)
                    let cH = Math.floor(curHeight * scale < a.w ? curHeight * scale : a.h)
                    this._imageMatrix = this.bilinear(this.iterationValues(curWidth, curHeight, cW, cH));
                    this._width = cW;
                    this._height = cH;
                    this.scale(t, a, scale, c)
                } else {
                    this._imageMatrix = this.bilinear(this.iterationValues(curWidth, curHeight, a.w, a.h))
                    this._decFile.width = a.w;
                    this._decFile.height = a.h;
                    let o = this.encodeData(this.flattenRGBA(this._imageMatrix), this._decFile)
                    c(o.img, o.ext);
                }
                break;
            }
        }
    }

    R(x, y, z) {
        let x1 = Math.floor(x);
        let x2 = Math.ceil(x)
        let q1 = this.RGBToPercent(this.accessArray(x1, y)[z])
        let q2 = this.RGBToPercent(this.accessArray(x2, y)[z])
        return ((x2 - x) / (x2 - x1)) * q1 + ((x - x1) / (x2 - x1)) * q2
    }

    P(x, q1, q2) {
        let x1 = Math.floor(x);
        let x2 = Math.ceil(x);
        return this.PercentToRGB(((x2 - x) / (x2 - x1)) * q1 + ((x - x1) / (x2 - x1)) * q2);
    }

    bilinear(iVals) {
        let { width, height } = iVals;
        let tempMatrix = [];
        for (let row = 0; row < height.length; row++) {
            let tempCol = [];
            for (let col = 0; col < width.length; col++) {
                let tempRGB = {};
                for (let i = 0; i < 4; i++) {
                    let z = this._RGB[i]
                    if (width[col] == Math.round(width[col])) {
                        let r1 = this.accessArray(width[col], Math.floor(height[row]))[z]
                        let r2 = this.accessArray(width[col], Math.ceil(height[row]))[z]
                        tempRGB[z] = Math.round((r1 + r2) / 2);
                    } else {
                        let r1 = this.R(width[col], Math.floor(height[row]), z);
                        let r2 = this.R(width[col], Math.ceil(height[row]), z);
                        tempRGB[z] = Math.round(this.P(width[col], r1, r2));
                    }
                }
                tempCol.push(tempRGB)
            }

            tempMatrix.push(tempCol)
        }
        return tempMatrix
    }

    bicubic(iVals) {
        this.getAllBicubicValues(this._imageMatrix)

        let { width, height } = iVals;
        let tempMatrix = [];
        for (let row = 0; row < height.length; row++) {
            let tempCol = [];
            for (let col = 0; col < width.length; col++) {
                let tempRGB = {};
                for (let i = 0; i < 4; i++) { //EACH RGB VAL
                    let pointX =  (width[col] - Math.floor(width[col])) + 1;
                    let pointY = (height[row]- Math.floor(height[row])) + 1 ;
                    let x = Math.floor(width[col]).clamp(0, this._bicubicObj.G.length - 1)
                    let y = Math.floor(height[row])
                    let z = this._RGB[i];
                    let arr = [];
                    for (let j = 0; j < 4; j++) {
                        arr.push(this.accessBicubicVals(x, (y + j).clamp(0, this._bicubicObj.G.length - 1), z).getPoint(pointX))
                    }
                    let tempCubicClass = new cubicClass(arr)

                    tempRGB[z] = Math.round(tempCubicClass.getPoint(pointY).clamp());
                }
                tempCol.push(tempRGB)
            }
            tempMatrix.push(tempCol)
        }
        return tempMatrix;
    }

    getAllBicubicValues(data) {
        for (let i = 0; i < data.length - 1; i++) {
            let row = data[i]
            let y1, y2, y3, y4;
            let rowData = { R: [], G: [], B: [], A: [] };
            if (i === 0) {
                y1 = i;
                y2 = i;
                y3 = i + 1;
                y4 = i + 2;
            } else if (i === data.length - 2) {
                y1 = i;
                y2 = i + 1;
                y3 = i + 2;
                y4 = i + 2;
            } else {
                y1 = i;
                y2 = i + 1;
                y3 = i + 2;
                y4 = i + 3;
            }
            for (let col = 0; col < row.length - 1; col++) {
                let x1, x2, x3, x4;
                if (col === 0) {
                    x1 = col;
                    x2 = col;
                    x3 = col + 1;
                    x4 = col + 2;
                } else if (col === row.length - 2) {
                    x1 = col;
                    x2 = col + 1;
                    x3 = col + 2;
                    x4 = col + 2;
                } else {
                    x1 = col;
                    x2 = col + 1;
                    x3 = col + 2;
                    x4 = col + 3;
                }

                let v1 = this.accessArray(x1, y1);
                let v2 = this.accessArray(x2, y2);
                let v3 = this.accessArray(x3, y3);
                let v4 = this.accessArray(x4, y4);

                for (let j = 0; j < 4; j++) {
                    let z = this._RGB[j]
                    rowData[z].push(new cubicClass([v1[z], v2[z], v3[z], v4[z]]))
                }
            }
            this._bicubicObj.R.push(rowData.R)
            this._bicubicObj.G.push(rowData.G)
            this._bicubicObj.B.push(rowData.B)
            this._bicubicObj.A.push(rowData.A)
        }
    }

    iterationValues(curWidth, currHeight, width, height) {
        let w = [];
        let h = [];
        for (let i = 0; i < width; i++) {
            w.push(i * (curWidth / width));
        }
        for (let i = 0; i < height; i++) {
            h.push(i * (currHeight / height));
        }
        return { 'width': w, 'height': h }
    }

    grayscale() {
        for (let row = 0; row < this._imageMatrix.length; row++) {
            let curRow = this._imageMatrix[row];
            for (let col = 0; col < curRow.length; col++) {
                let { R, G, B, A } = this._imageMatrix[row][col];
                let avg = Math.round((R + G + B) / 3);
                R = avg;
                G = avg;
                B = avg;
                this._imageMatrix[row][col] = { R, G, B, A }
            }
        }
    }

    brightness(value) {
        for (let row = 0; row < this._imageMatrix.length; row++) {
            let curRow = this._imageMatrix[row];
            for (let col = 0; col < curRow.length; col++) {
                let { R, G, B, A } = this._imageMatrix[row][col];
                R = (R + value).clamp(0, 255)
                G = (G + value).clamp(0, 255)
                B = (B + value).clamp(0, 255)
                this._imageMatrix[row][col] = { R, G, B, A }
            }
        }
    }

    inverse() {
        for (let row = 0; row < this._imageMatrix.length; row++) {
            let curRow = this._imageMatrix[row];
            for (let col = 0; col < curRow.length; col++) {
                let { R, G, B, A } = this._imageMatrix[row][col];
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
                this._imageMatrix[row][col] = { R: arr[0], G: arr[1], B: arr[2], A }
            }
        }
    }

    contrast(differences) {
        for (let row = 0; row < this._imageMatrix.length; row++) {
            let curRow = this._imageMatrix[row];
            for (let col = 0; col < curRow.length; col++) {
                let { R, G, B, A } = this._imageMatrix[row][col];
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
                            if (this.isBetween(val, op1, op2)) {
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
                this._imageMatrix[row][col] = { R: arr[0], G: arr[1], B: arr[2], A }
            }
        }

    }

    isBetween(val, op1, op2) {
        if (op1 <= val && val <= op2) {
            return true;
        }
        return false
    }

    encodeData(arr, dFile) {
        let { width, height } = dFile
        let encodedBuffer = new Buffer.from(arr);

        let canvas = createCanvas(width, height),
            ctx = canvas.getContext('2d');

        let idata = ctx.createImageData(width, height);
        idata.data.set(encodedBuffer);

        ctx.putImageData(idata, 0, 0);

        let dataUrl = canvas.toDataURL('image/jpeg', 1)
        let string = dataUrl;
        let regex = /^data:.+\/(.+);base64,(.*)$/;

        let matches = string.match(regex);
        let ext = matches[1];
        let data = matches[2];
        let img = new Buffer.from(data, 'base64');
        //fs.writeFileSync('data.' + ext, buffer);
        return { img, ext }
    }

    toAsciiArt(turningPoint = "120") {
        let data = this._imageMatrix;
        let string = ''
        for (let i = 0; i < data.length; i++) {
            let row = data[i]
            string = string + '\n'
            for (let r = 0; r < row.length; r++) {
                let d = row[r]
                if (d.R > turningPoint) {
                    string = string + '#'
                } else {
                    string = string + ' '
                }
            }
        }
        return string
    }

}

module.exports = image;