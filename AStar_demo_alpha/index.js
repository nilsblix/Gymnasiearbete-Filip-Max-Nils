import { AStar } from "./astar.js";
import { Dijkstra } from "./djikstra.js";
import { GreedyBEFS } from "./greedy_befs.js";
import { BFS } from "./bfs.js";

const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const search_algorithm_selector = document.getElementById("search-algorithm-select");

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


let solver = {
    n : 96, // number of cells in one of the dimension
    cell_width : null, // Math.max(canvas.width / 32, canvas.height / 32),
    grid : null, // new Grid(canvas.width / 32),
    path : null,
    destination : new Cell(0, 0, false),
    source : new Cell(10, 10, false),
    frameCount : 0,
    aStar : new AStar(),
    g_befs : new GreedyBEFS(),
    dijkstra : new Dijkstra(),
    bfs : new BFS(),
}
solver.cell_width = Math.max(canvas.width / solver.n, canvas.height / solver.n);
solver.grid = new Grid(canvas.width / solver.n);

let mouse_grid = new Vector2(0, 0);

function draw() {

    const solv = solver;
    function handlePath(finder) {
        const st = performance.now();
        finder.findPath(solv.grid, solv.source, solv.destination)
        const et = performance.now();
        finder.time_elapsed = et - st;
    }

    handlePath(solver.aStar);
    handlePath(solver.dijkstra);

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

            // if (search_algorithm_selector.value == "a-star")
            //     [color, cellBorderColor] = solver.aStar.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);
            // if (search_algorithm_selector.value == "greedy-bfs")
            //     [color, cellBorderColor] = solver.g_befs.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);
            // if (search_algorithm_selector.value == "djikstra")
            //     [color, cellBorderColor] = solver.dijkstra.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);
            // if (search_algorithm_selector.value == "bfs")
            //     [color, cellBorderColor] = solver.bfs.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);

            [color, cellBorderColor] = solver.dijkstra.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);
            [color, cellBorderColor] = solver.aStar.drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]);
            
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

        }
    }
}

function allBlocked() {
    for (let x = 0; x < solver.grid.numX; x++) {
        for (let y = 0; y < solver.grid.numY; y++) {
            solver.grid.cells[x][y].isBlocked = true;
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

function start() {

    randomWallGrid();

    // const cell = solver.grid.getCell(3, 3);
    // cell.isBlocked = true;

    // ondskefullaBlockeraren();

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
    if (e_pressed) {
        for (let x = -2; x <= 2; x++) {
            for (let y = -2; y <= 2; y++) {
                solver.grid.cells[mouse_grid.x + x][mouse_grid.y + y].isBlocked = false;
            }
        }
    }
    if (w_pressed) {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                solver.grid.cells[mouse_grid.x + x][mouse_grid.y + y].isBlocked = true;
            }
        }
    }

    if (search_algorithm_selector.value == "")
        document.getElementById("search-algorithm-dt").innerHTML = -1;
    if (search_algorithm_selector.value == "a-star")
        document.getElementById("search-algorithm-dt").innerHTML = solver.aStar.time_elapsed.toFixed(3);
    if (search_algorithm_selector.value == "greedy-befs")
        document.getElementById("search-algorithm-dt").innerHTML = solver.g_befs.time_elapsed.toFixed(3);
    if (search_algorithm_selector.value == "djikstra")
        document.getElementById("search-algorithm-dt").innerHTML = solver.dijkstra.time_elapsed.toFixed(3);
    if (search_algorithm_selector.value == "bfs")
        document.getElementById("search-algorithm-dt").innerHTML = solver.bfs.time_elapsed.toFixed(3);

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

            const solv = solver;
            function handlePath(finder) {
                const st = performance.now();
                finder.findPath(solv.grid, solv.source, solv.destination)
                const et = performance.now();
                finder.time_elapsed = et - st;
            }

            // if (search_algorithm_selector.value == "a-star")
            //     handlePath(solver.aStar);
            // if (search_algorithm_selector.value == "greedy-befs")
            //     handlePath(solver.g_befs);
            // if (search_algorithm_selector.value == "djikstra")
            //     handlePath(solver.dijkstra);
            // if (search_algorithm_selector.value == "bfs")
            //     handlePath(solver.bfs);

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
