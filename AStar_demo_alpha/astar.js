export class AStar {
    constructor() {
        this.openSet = [];
        this.closedSet = [];
        this.path = [];

        this.time_elapsed = 0;
    }

    findPath(grid, start, end) {
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
                const path = [];
                let temp = current;
                while (temp.previous) {
                    path.push(temp);
                    temp = temp.previous;
                }
                path.push(start); // Optionally include the start cell
                this.path = path.reverse();
                return;
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

    drawCell([cell, color, alternativeBorderColor, cellBorderColor, pathColor]) {
        // Check if the cell is in the closedSet and color it accordingly
        if (this.closedSet.includes(cell)) {
            color = "rgba(" + 10 * cell.h + ", 0," + 10 * cell.g + ", 1)"; // blue to red
            cellBorderColor = alternativeBorderColor;
        }
    
        // If the cell is part of the final path, use the path color
        if (this.path.includes(cell)) {
            color = pathColor;
        }
    
        // Return the updated color and border color for further use
        return [color, cellBorderColor];
    }

}