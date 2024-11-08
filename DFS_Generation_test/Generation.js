const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const x_offset = 30;
const y_offset = 50;
canvas.width = 630;
canvas.height = 630;
c.fillStyle="white"
c.fillRect(0,0,canvas.width,canvas.height)

class Vector2 {
    constructor(x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    static addVectors(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    static subtractVectors(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    sqr_magnitude() {
        return this.x * this.x + this.y * this.y;
    }

    magnitude() {
        if (this.x == 0 && this.y == 0) return 0;
        return Math.sqrt(this.sqr_magnitude());
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    toString() {
        return "x: " + this.x + " y: " + this.y;
    }

    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
}

class Cell {
    constructor(x, y, isBlocked = false) {
        this.id = new Vector2(x, y);
        this.isBlocked = isBlocked;
    }

    equals(other) {
        return this.id.equals(other.id);
    }
}
class Grid {
    constructor(cell_width) {
        this.numX = canvas.width/10;
        this.numY = canvas.height/10;
        this.cells = [];

        // Initialize the grid with cells
        for (let x = 0; x < this.numX; x++) {
            let row = [];
            for (let y = 0; y < this.numY; y++) {
                row.push(new Cell(x, y));
            }
            this.cells.push(row);
        }
    }

    getCell(x, y) {
        if (x >= 0 && x < this.numX && y >= 0 && y < this.numY) {
            return this.cells[x][y];
        }
        return null;
    }

    setWall(x, y, isBlocked) {
        let cell = this.getCell(x, y);
        if (cell) {
            cell.isBlocked = isBlocked;
        }
    }


}

class AStar {
    constructor() {
        this.openSet = [];
        this.closedSet = [];
    }
}

let solver = {
    n : 64, // number of cells in one of the dimension
    cell_width : null, // Math.max(canvas.width / 32, canvas.height / 32),
    grid : null, // new Grid(canvas.width / 32),
    path : null,
    destination : new Cell(0, 0, false),
    source : new Cell(10, 10, false),
    frameCount : 0,
    aStar : new AStar()
}
solver.cell_width = 10;
solver.grid = new Grid(canvas.width / solver.n);

function draw() {
    const blockedColor = "#000000";
    const pathColor = "#FFFF00"; // "#9e4fff";
    const destinationColor = "#FF0000";
    const sourceColor = "#00FF00";
    const alternativeBorderColor = "#000000";

    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 0; y < solver.grid.numY; y++) {

            const cell = solver.grid.getCell(x, y);
            let color = "#FFFFFF";
            let cellBorderColor = "rgba(0,0,0,0.2)";


            if (cell.isBlocked) {
                color = blockedColor;
                cellBorderColor = alternativeBorderColor;
            }

            if (cell.id.x == 2 && cell.id.y == 3) {
                color = "#FF0000";
            }

            // Draw the cell
            c.fillStyle = color;
            c.fillRect(x * solver.cell_width, canvas.height - (y + 1) * solver.cell_width, solver.cell_width, solver.cell_width);

            // Optionally, draw cell borders
            c.lineWidth = 0.5;
            c.strokeStyle = cellBorderColor;
            c.strokeRect(x * solver.cell_width, canvas.height - (y + 1) * solver.cell_width, solver.cell_width, solver.cell_width);

        }
    }

}

function ondskefullaBlockeraren() {
    for (let x = 1; x < solver.grid.numX; x += 2) {
        for (let y = 0; y < solver.grid.numY; y++) {
            solver.grid.cells[x][y].isBlocked = true;
        }
    }

    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 1; y < solver.grid.numY; y += 2) {
            solver.grid.cells[x][y].isBlocked = true;
        }
    }
}

/*function update() {
    
    document.addEventListener("keypress", function(event) {
        if (event.key == "w") {

            console.log("pressed w")
        }
    })

    requestAnimationFrame(update);
}

update()*/
    