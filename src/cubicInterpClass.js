class cubicInterp {
    constructor(points){
        this._points = [];

        for (let i = 0; i < 4; i++){
            this._points.push([i, points[i]])
        }

        this._m = [];
        this._z = [];
        this._ab = [];
        for (let i = 0; i < 3; i ++){
           this._m.push(this.pieceWiseLinearInterp(this._points[i], this._points[i + 1]))
        }
        this.solvingZ()
        this.solvingAB();
    }

    get points(){
        return this._points
    }

    pieceWiseLinearInterp(point1, point2) {
        let [x1, y1] = point1;
        let [x2, y2] = point2;
    
        return (y2 - y1) / (x2 - x1)
    }

    solvingZ() {
        let points = this._points
        let [m1, m2, m3] = this._m;
        let x1 = points[0][0];
        let x2 = points[1][0];
        let x3 = points[2][0];
        let x4 = points[3][0];
        this._z.push(6 * (
            (m3 * x2 + m2 * x3 - m3 * x3 + 2 * m2 * x4 + 2 * m1 * x2 - 2 * m1 * x4 - 3 * m2 * x2) / (
                4 * (x1 * x2 + x3 * x4 - x1 * x4) - this.sqr(x2 + x3)
            )
        ))
        this._z.push(6 * (
            (3 * m2 * x3 + 2 * m3 * x1 + m1 * x2 - 2 * m2 * x1 - 2 * m3 * x3 - m1 * x3 - m2 * x2) /
            (this.sqr(x2 + x3) - 4 * (x1 * x2 + x3 * x4 - x1 * x4))
        ))
    }
    
    solvingAB() {
        let points = this._points
        let [z2, z3] = this._z
        let x1 = points[0][0];
        let x2 = points[1][0];
        let x3 = points[2][0];
        let x4 = points[3][0];
        let a = [];
        let b = [];
        a.push((z2) / (6 * (x1 - x2)))
        a.push((2 * z2 + z3) / (6 * (x2 - x3)))
        a.push((z3) / (3 * (x3 - x4)))
        b.push((2 * z2) / (6 * (x2 - x1)))
        b.push((2 * z3 + z2) / (6 * (x3 - x2)))
        b.push((z3) / (6 * (x4 - x3)))
        this._ab.push(a, b)
    }

    L(x) {
        let points = this._points;
        let m = this._m;
        return m[Math.floor(x)] * (x - points[Math.floor(x)][0]) + points[Math.floor(x)][1]
    }
    
    C(x) {
        let points = this._points;
        let ab = this._ab;
        return ab[0][Math.floor(x)] * this.sqr(x - points[Math.floor(x) + 1][0]) * (x - points[Math.floor(x)][0]) + ab[1][Math.floor(x)] * (x - points[Math.floor(x) + 1][0]) * this.sqr(x - points[Math.floor(x)][0])
    }

    getPoint(x) {
        return Math.round(this.L(x) + this.C(x))
    }
    
    sqr(x) {
        return Math.pow(x, 2)
    }
}
module.exports = cubicInterp;
