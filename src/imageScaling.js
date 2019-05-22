const RGBA = ['R','G','B','A'];

module.exports = (img, type) => {
    switch (type.toLowerCase()) {
        case "bicubic": {

            for (let row = 1; row < img.length; row = row + 4) {

                for (let col = 0; col < row[i].length; col = col + 4) {
                    for (let i = 0; i < 3; i++){
                        let curRow = row[i]
                        let grid = [
                            row[i][col][RGBA[i]], row[i][col + 1][RGBA[i]], row[i][col + 3][RGBA[i]], row[i][col + 4][RGBA[i]],
                            row[i + 1][col][RGBA[i]], row[i + 1][col + 1][RGBA[i]], row[i + 1][col + 3][RGBA[i]], row[i + 1][col + 4][RGBA[i]],
                            row[i + 2][col][RGBA[i]], row[i + 2][col + 1][RGBA[i]], row[i + 2][col + 3][RGBA[i]], row[i + 2][col + 4][RGBA[i]],
                            row[i + 3][col][RGBA[i]], row[i + 3][col + 1][RGBA[i]], row[i + 3][col + 3][RGBA[i]], row[i + 3][col + 4][RGBA[i]]
                        ]
                    }
                }

            }
            break;
        }
        case 'bilinear': {
            for (let r = 1; r < img.length; r = r) {
                console.log(img[r].length)
                for (let c = 0; c < img[r].length; c = c) {
                    let curCol = img[r][c]
                    let nextCol = img[r][c]
                    for (let i = 0; i < 4; i++){
                        let curRow = img[i]
                        let x1 = img[r][c]
                        let x2 = (img[r][c + 1] ? img[r][c] : img[r][c] ) 
                        
                        let r1 = R(img[r][c], img[r][c+1], (img[r][c] + img[r][c+1])/2)
                        let r2 = R(img[r+1][c], img[r+1][c+1], (img[r+1][c] + img[r+1][c+1])/2)
                    }
                }
            }
        }
    }
}

function p(x, y) {

}
function R(x1, x2, x){
    return ((x2 - x)/(x2-x1))
}