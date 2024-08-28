const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const x_offset = 20;
const y_offset = 100;
canvas.width = window.innerWidth - x_offset;
canvas.height = window.innerHeight - y_offset;

// const simulation_width = 10;
// const mult_canv_sim = canvas.width / simulation_width;
// const sim_width = canvas.width / mult_canv_sim;
// const sim_height = canvas.height / mult_canv_sim;

// function cs_x(v) {
//     return v.x * mult_canv_sim;
// }

// function cs_y(v) {
//     return canvas.height - v.y * mult_canv_sim;
// }

// function cs(v) {
//     return new Vector2(cs_x(v), cs_y(v));
// }

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

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
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
        this.g = 0; // Cost from start to this cell
        this.h = 0; // Heuristic cost from this cell to the end
        this.f = 0; // Total cost (g + h)
        this.previous = null; // Previous cell in the path
    }

    // Euclidean distance from this to end
    calculateHeuristic(end) {
        this.h = (this.id.subtract(end.id)).magnitude();
        this.f = this.g + this.h;
    }

    equals(other) {
        return this.id.equals(other.id);
    }
}

class Grid {
    constructor(cell_width) {
        this.numX = Math.floor(canvas.width / cell_width);
        this.numY = Math.floor(canvas.height / cell_width);
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

    getNeighbours(cell) {
        const neighbours = [];
        const pos = cell.id;
        const directions = [
            new Vector2(1, 0),  // right
            new Vector2(0, 1),  // up
            new Vector2(-1, 0), // left
            new Vector2(0, -1)  // down
        ]

        for (let dir of directions) {
            let neighbour = this.getCell(pos.x + dir.x, pos.y + dir.y);
            if (neighbour && !neighbour.isBlocked) {
                neighbours.push(neighbour);
            }
        }

        return neighbours;

    }
}

function aStar(grid, start, end) {
    let openSet = [start];
    let closedSet = [];

    start.calculateHeuristic(end);

    while (openSet.length > 0) {
        // Find the cell in the open set with the lowest f value
        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        let current = openSet[lowestIndex];

        // If the current cell is the end cell, we've found the path
        if (current.equals(end)) {
            let path = [];
            let temp = current;
            while (temp.previous) {
                path.push(temp);
                temp = temp.previous;
            }
            path.push(start); // Optionally include the start cell
            return path.reverse();
        }

        // Move the current cell from open to closed set
        openSet.splice(lowestIndex, 1);
        closedSet.push(current);

        // Check each neighbor of the current cell
        let neighbours = grid.getNeighbours(current);
        for (let neighbour of neighbours) {
            if (closedSet.includes(neighbour)) {
                continue;
            }

            let tentativeG = current.g + 1;

            if (!openSet.includes(neighbour)) {
                openSet.push(neighbour);
            } else if (tentativeG >= neighbour.g) {
                continue;
            }

            neighbour.g = tentativeG;
            neighbour.calculateHeuristic(end);
            neighbour.previous = current;
        }
    }

    // If we get here, there's no valid path
    console.log("No valid path has been found");
    return null;
}

let solver = {
    cell_width : canvas.width / 32,
    grid : new Grid(canvas.width / 32),
    path : null,
    destination : new Cell(0, 0, false),
    source : new Cell(1, 0, false),
    frameCount : 0
}

function draw() {
    // console.log("function draw() has been called")

    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 0; y < solver.grid.numY; y++) {
            c.fillStyle = "#808080";
            c.beginPath();

            let pos = new Vector2(x * solver.cell_width, (y+1) * solver.cell_width)

            c.rect(pos.x, canvas.height - pos.y, solver.cell_width, solver.cell_width);
            c.closePath();
            c.fill();

            let delta = 2;
            let smaller_width = solver.cell_width - delta;
            let new_pos = pos.add(new Vector2(delta / 2, delta / 2));

            c.fillStyle = "#D3D3D3";
            if (solver.grid.cells[x][y].isBlocked) {
                c.fillStyle = "#DD3333"
            }
            c.beginPath();
            c.rect(new_pos.x, canvas.height - new_pos.y, smaller_width, smaller_width);
            c.closePath();
            c.fill();

            // console.log("one cell has been drawn, id: " + pos.toString());

        }
    }

    // console.log("grid render has been completed");

    if (solver.path != null) {
        for (let cell of solver.path) {
            c.fillStyle = "#FFFF00";
            c.beginPath();

            let pos = new Vector2(cell.id.x * solver.cell_width, (cell.id.y+1) * solver.cell_width)

            c.rect(pos.x, canvas.height - pos.y, solver.cell_width, solver.cell_width);
            c.closePath();
            c.fill();
        }
    }

    // destination
    c.fillStyle = "#AA0000";
    c.beginPath();

    let dest_pos = new Vector2(solver.destination.id.x * solver.cell_width, (solver.destination.id.y+1) * solver.cell_width)

    c.rect(dest_pos.x, canvas.height - dest_pos.y, solver.cell_width, solver.cell_width);
    c.closePath();
    c.fill();

    // source
    c.fillStyle = "#00BB00";
    c.beginPath();

    let src_pos = new Vector2(solver.source.id.x * solver.cell_width, (solver.source.id.y+1) * solver.cell_width)

    c.rect(src_pos.x, canvas.height - src_pos.y, solver.cell_width, solver.cell_width);
    c.closePath();
    c.fill();

}

function start() {
    for (let i = 0; i < 7; i++) {
        solver.grid.cells[4][i].isBlocked = true;
    }

    for (let i = 0; i < 10; i++) {
        solver.grid.cells[i][10].isBlocked = true;
    }

    for (let i = 5; i < 15; i++) {
        solver.grid.cells[9][i].isBlocked = true;
    }

    let y = 15;
    for (let x = 15; x < 28; x++) {
        solver.grid.cells[x][y].isBlocked = true;
        y--;
    }

}

function update() {
    // console.log("frameCount: "+ solver.frameCount);
    solver.frameCount++;

    requestAnimationFrame(update);
}

start();
update();

canvas.addEventListener("mousemove", function(event) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();
    let canvas_pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);

    const grid_x = Math.floor(canvas_pos.x / solver.cell_width);
    const grid_y = Math.floor((canvas.height - canvas_pos.y) / solver.cell_width)

    let grid_pos = new Vector2(grid_x, grid_y);
    // solver.grid.cells[grid_x][grid_y].isBlocked = !solver.grid.cells[grid_x][grid_y].isBlocked;

    solver.source = new Cell(grid_pos.x, grid_pos.y, false)
    solver.path = aStar(solver.grid, solver.source, solver.destination);

    console.log("numX: " + solver.grid.numX);
    console.log("numY: " + solver.grid.numY);


    console.log("m: canvas_pos = " + canvas_pos.toString());
    console.log("m:   grid_pos = " + grid_pos.toString());
    console.log("frameCount: " + solver.frameCount);

    console.log(" ");

    draw();

});
