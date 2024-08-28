const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const x_offset = 20;
const y_offset = 100;
canvas.width = window.innerWidth - x_offset;
canvas.height = window.innerHeight - y_offset;

const simulation_width = 10;
const mult_canv_sim = canvas.width / simulation_width;
const sim_width = canvas.width / mult_canv_sim;
const sim_height = canvas.height / mult_canv_sim;

function cs_x(v) {
    return v.x * mult_canv_sim;
}

function cs_y(v) {
    return canvas.height - v.y * mult_canv_sim;
}

function cs(v) {
    return new Vector2(cs_x(v), cs_y(v));
}

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
}

class DynamicObject {
    constructor(pos, mass) {
        this.pos = pos;
        this.vel = new Vector2(0,0);
        this.force = new Vector2(0,0);
        this.mass = mass;
        this.w = 1 / mass;
    }

    addGravity(gravity) {
        this.force.add(gravity.mult(this.mass));
    }

    integrate(dt) {
        let acc = this.force.mult(this.w);

        // this.vel.add(acc.mult(dt));
        // this.pos.add(this.vel.mult(dt));

        // this.force = new Vector2(0,0);

        // return;

        let k1v = acc.mult(dt);
        let k1p = k1v.mult(dt);

        let k2v = acc.mult(dt);
        let k2p = (this.vel.add(k2v.mult(dt))).mult(dt);

        let k3v = acc.mult(dt);
        let k3p = (this.vel.add(k3v.mult(dt))).mult(dt);

        let k4v = acc.mult(dt);
        let k4p = (this.vel.add(k3v)).mult(dt);

        const one_sixth = 1 / 6;
        
        let delta_p = k1p.add((k2p.mult(2)).add((k3p.mult(2)).add(k4p))).mult(one_sixth);
        let delta_v = k1v.add((k2v.mult(2)).add((k3v.mult(2)).add(k4v))).mult(one_sixth);

        this.pos.add(delta_p);
        this.vel.add(delta_v);

        this.force = new Vector2(0,0);
    }
}

let physicsState = {
    gravity: new Vector2(0, -10),
    dt: 1 / 60,
    m_objects: []
}

function setupScene() {
    physicsState.m_objects.push(new DynamicObject(new Vector2(4, 5), 1));
}

function physicsStep() {
    for (let i = 0; i < physicsState.m_objects.length; i++) {
        physicsState.m_objects[i].addGravity(physicsState.gravity);
    }

    for (let i = 0; i < physicsState.m_objects.length; i++) {
        physicsState.m_objects[i].integrate(physicsState.dt);
    }
}

function drawCircle(pos, radius, color) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    c.closePath();
    c.fill();

    console.log("drawCircle at: " + pos.toString());
}

function render() {
    for (let i = 0; i < physicsState.m_objects.length; i++) {
        let obj = physicsState.m_objects[i];
        let pos = cs(obj.pos);
        drawCircle(pos, 0.5 * mult_canv_sim, "#FF0000");
    }
}

let frameCount = 0;

function start() {
    setupScene();
}

function update() {
    // c.clearRect(0, 0, canvas.width, canvas.height);

    render();

    physicsStep();

    console.log("framecount: " + frameCount);
    frameCount++;
    requestAnimationFrame(update);
}

start();
update();

canvas.addEventListener("mousemove", function(event) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();
    let pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
    const radius = 0.5;
    drawCircle(pos, mult_canv_sim * radius, "#FF0000");
})

