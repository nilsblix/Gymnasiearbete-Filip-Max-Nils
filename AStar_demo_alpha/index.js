const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const x_offset = 30;
const y_offset = 50;
canvas.width = window.innerWidth - x_offset;
canvas.height = window.innerHeight - y_offset;

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
        this.g = 0; // Cost from start to this cell
        this.h = 0; // Heuristic cost from this cell to the end
        this.f = 0; // Total cost (g + h)
        this.previous = null; // Previous cell in the path
    }

    // Euclidean distance from this to end
    calculateHeuristic(end) {
        this.h = Vector2.subtractVectors(this.id, end.id).magnitude();
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
            new Vector2(1,1),   // top right
            new Vector2(0, 1),  // top
            new Vector2(-1, 1), // top left
            new Vector2(-1, 0), // left
            new Vector2(-1, -1),// down left  
            new Vector2(0, -1), // down
            new Vector2(1, -1)  // down right
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

class AStar {
    constructor() {
        this.openSet = [];
        this.closedSet = [];
    }

    getPath(grid, start, end) {
        this.openSet = [start];
        this.closedSet = [];

        start.calculateHeuristic(end);

        while (this.openSet.length > 0) {
            // Find the cell in the open set with the lowest f value
            let lowestIndex = 0;
            for (let i = 1; i < this.openSet.length; i++) {
                if (this.openSet[i].f < this.openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            let current = this.openSet[lowestIndex];

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
            this.openSet.splice(lowestIndex, 1);
            this.closedSet.push(current);

            // Check each neighbor of the current cell
            let neighbours = grid.getNeighbours(current);
            for (let neighbour of neighbours) {
                if (this.closedSet.includes(neighbour)) {
                    continue;
                }

                let tentativeG = current.g + (current.id.x != neighbour.id.x && current.id.y != neighbour.id.y ? Math.SQRT2 : 1);

                if (!this.openSet.includes(neighbour)) {
                    this.openSet.push(neighbour);
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
solver.cell_width = Math.max(canvas.width / solver.n, canvas.height / solver.n);
solver.grid = new Grid(canvas.width / solver.n);

let mouse_grid = new Vector2(0, 0);

function draw() {
    const blockedColor = "#000000";
    const pathColor = "#FFFF00"; // "#9e4fff";
    const destinationColor = "#FF0000";
    const sourceColor = "#00FF00";
    const alternativeBorderColor = "#dddddd";
    // const openSetColor = "purple";
    // const closedSetColor = "purple";

    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 0; y < solver.grid.numY; y++) {

            const cell = solver.grid.getCell(x, y);
            let color = "#FFFFFF";
            let cellBorderColor = "rgba(0,0,0,0.2)";


            if (cell.isBlocked) {
                color = blockedColor;
                cellBorderColor = alternativeBorderColor;
            }
            if (solver.aStar.closedSet.includes(cell)) {
                // essentials
                color = "rgba(" + 10 * cell.h + ", 0," + 10 * cell.g + ", 1)"; // blue to red
                // color = "rgba(" + 10 * cell.g + "," + 10 * cell.h + ", 1)"; // green to red
                // color = "rgba(0," + 10 * cell.g + "," + 10 * cell.h +", 1)"; // blue to green

                // randoms:
                // let r = 0.2 * cell.g * cell.h + 100;
                // let g = 20;
                // let b = 0.1 * cell.g * cell.h;
                // color = "rgba(" + r + "," + g + "," + b + "1)";

                // border
                cellBorderColor = alternativeBorderColor;
            }
            if (solver.path && solver.path.includes(cell))
                color = pathColor;
            if (cell.equals(solver.source)) {
                color = sourceColor;
            }
            if (cell.equals(solver.destination)) {
                color = destinationColor;
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

function randomWallGrid() {
    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 0; y < solver.grid.numY; y++) {
            let rand = Math.random();
            if (rand > 0.5) {
                solver.grid.cells[x][y].isBlocked = true;
            }
            // * y / solver.grid.numY
        }
    }
}

function start() {

    // randomWallGrid();

    // for (let i = 0; i < 7; i++) {
    //     solver.grid.cells[4][i].isBlocked = true;
    // }

    // for (let i = 0; i < 10; i++) {
    //     solver.grid.cells[i][10].isBlocked = true;
    // }

    // for (let i = 5; i < 22; i++) {
    //     solver.grid.cells[9][i].isBlocked = true;
    // }

    // // let y = 15;
    // // for (let x = 15; x < 28; x++) {
    // //     solver.grid.cells[x][y].isBlocked = true;
    // //     y--;
    // // }

    // for (let y = 5; y < 20; y++) {
    //     solver.grid.cells[15][y].isBlocked = true;
    //     solver.grid.cells[16][y].isBlocked = true;
    // }

    // for (let x = 15; x < 30; x++) {
    //     solver.grid.cells[x][5].isBlocked = true;
    //     solver.grid.cells[x][6].isBlocked = true;
    // }

}

let astar_timeElapsed = 0;
let render_timeElapsed = 0;

let d_pressed = false;
let e_pressed = false;
let w_pressed = false;


function update() {
    // console.log("frameCount: "+ solver.frameCount);
    solver.frameCount++;

    if (d_pressed)
        solver.destination = new Cell(mouse_grid.x, mouse_grid.y, false);
    if (e_pressed)
        solver.grid.cells[mouse_grid.x][mouse_grid.y].isBlocked = false;
    if (w_pressed)
        solver.grid.cells[mouse_grid.x][mouse_grid.y].isBlocked = true;

    document.getElementById("astar_ms").innerHTML = astar_timeElapsed.toFixed(3);
    document.getElementById("render_ms").innerHTML = render_timeElapsed.toFixed(3);
    document.getElementById("sum_ms").innerHTML = (astar_timeElapsed + render_timeElapsed).toFixed(3);
    // timeElapsed = 0;

    requestAnimationFrame(update);
}

start();
update();

let lastGridPos = new Vector2(-1, -1); // Track the last grid position to avoid redundant calculations

canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    let canvas_pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);

    const grid_x = Math.floor(canvas_pos.x / solver.cell_width);
    const grid_y = Math.floor((canvas.height - canvas_pos.y) / solver.cell_width);

    mouse_grid.x = grid_x;
    mouse_grid.y = grid_y;

    let grid_pos = new Vector2(grid_x, grid_y);

    if (!grid_pos.equals(lastGridPos)) {
        solver.source = new Cell(grid_x, grid_y, false);

        if (solver.source && solver.destination) {

            solver.aStar = new AStar();

            let astar_st = performance.now();
            solver.path = solver.aStar.getPath(solver.grid, solver.source, solver.destination);
            let astar_et = performance.now();

            astar_timeElapsed = astar_et - astar_st;

            lastGridPos = grid_pos; // Update last tracked position
        }
    }

    let render_st = performance.now();

    // Redraw only after path calculation, if needed
    c.clearRect(0, 0, canvas.width, canvas.height);
    draw();

    let render_et = performance.now();
    render_timeElapsed = render_et - render_st;

});

document.addEventListener("keydown", function(event) {
    if (event.key == "d") 
        d_pressed = true;
    if (event.key == "e")
        e_pressed = true;
    if (event.key == "w")
        w_pressed = true;
    
})

document.addEventListener("keyup", function(event) {
    if (event.key == "d") 
        d_pressed = false;
    if (event.key == "e")
        e_pressed = false;
    if (event.key == "w")
        w_pressed = false;
})

// function handleKeybind(keybind, action) {
//     document.addEventListener("keydown", function(event) {
//         if (event.key == keybind) {
//             action(event);
//         }
//     })
// }

// let intervalId;

// function isAKeybind(event) {
//     return event.key == "d" || event.key == "e" ||event.key == "w";
// }

// function handleBlockingOfWalls(version) {
//     const rect = canvas.getBoundingClientRect();
//     let canvas_pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);

//     const grid_x = Math.floor(canvas_pos.x / solver.cell_width);
//     const grid_y = Math.floor((canvas.height - canvas_pos.y) / solver.cell_width);

//     switch (version) {
//         case "d": // destination
//             solver.destination = new Cell(grid_x, grid_y, false);
//             break;
//         case "e": // erasing
//             solver.grid.cells[grid_x][grid_y].isBlocked = false;
//             break;
//         case "w": // wall
//             solver.grid.cells[grid_x][grid_y].isBlocked = true;
//             break;
//     }
// }

// document.addEventListener('keydown', (event) => {
//     if (isAKeybind(event) && !intervalId) {
//         intervalId = setInterval(handleBlockingOfWalls(event.key), 1000 / 60); // Calls myFunction every 100ms
//     }
// });

// document.addEventListener('keyup', (event) => {
//     if (isAKeybind(event)) {
//         clearInterval(intervalId);
//         intervalId = null;
//     }
// });

// canvas.addEventListener("mousedown", function(event) {
//     const rect = canvas.getBoundingClientRect();
//     let canvas_pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);

//     const grid_x = Math.floor(canvas_pos.x / solver.cell_width);
//     const grid_y = Math.floor((canvas.height - canvas_pos.y) / solver.cell_width);

//     solver.destination = new Cell(grid_x, grid_y, false);

// })

