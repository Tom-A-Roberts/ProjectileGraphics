/// <reference path="p5.global-mode.d.ts"/>



var projectiles = new Array(0);
var mousePositions = new Array(0);
var particles = new Array(0);
var mDownPrevious = false;
var mouseVelX = 0;
var mouseVely = 0;
var cloudImage;
var debrisImage;
var shellImage;
var backgroundImage;

var maxWidth;
var maxHeight;

var offsetX = 0;
var offsetY = 0;
var offsetVelX = 0;
var offsetVelY = 0;

const mouseSmoothing = 5;
const gravityUp = -8;
const gravityDown = -16;
var framerate = 60;
const width = 1100;
const height = 700;
const leftPadding = 15;
const upperPadding = 15;
//"airbnb-base"

const nullNormal = new Position(0, 0);

function preload() {
    cloudImage = loadImage("https://raw.githubusercontent.com/ksqk34/ProjectileGraphics/master/src/Images/CloudFaded.png");
    debrisImage = loadImage("https://raw.githubusercontent.com/ksqk34/ProjectileGraphics/master/src/Images/Debris.png");
    shellImage = loadImage("https://raw.githubusercontent.com/ksqk34/ProjectileGraphics/master/src/Images/Shell.png");
    backgroundImage = loadImage("https://raw.githubusercontent.com/ksqk34/ProjectileGraphics/master/src/Images/MountainBackground2.png");
}

function setup() {
    maxWidth = width + leftPadding*2;
    maxHeight = height + upperPadding*2;
    var canvas = createCanvas(maxWidth, maxHeight);
    frameRate(framerate);
    //framerate *= 2;
    //framerate *= 0.8;
    canvas.parent("holder");
    background(200, 200, 200);
    cursor(CROSS);

}

function draw() {
    background(220, 220, 220);
    image(backgroundImage, (leftPadding/2) + offsetX, (upperPadding/2) - offsetY, width + leftPadding, height + upperPadding);

    noStroke();
    fill(0, 0, 0);
    var projectileCount = projectiles.length;
    var i = 0;
    while (i < projectileCount){
        projectiles[i].MakeMove();
        projectiles[i].Render();
        if (projectiles[i].deadNormal === nullNormal) {
            i += 1;
        }
        else {
            DeleteProjectile(i);
            projectileCount -= 1;
            
        }
    }
    var particleCount = particles.length;
    i = 0;
    while (i < particleCount) {
        particles[i].MakeMove();
        particles[i].Render();
        if (particles[i].dead) {
            particleCount -= 1;
            DeleteParticle(i);
        }
        else {
            i += 1;
        }
    }

    var newMouseX = GetPositionFromRawX(mouseX);
    var newMouseY = GetPositionFromRawY(mouseY);
    if (mouseIsPressed) {
        if (mDownPrevious === false) {
            //Mouse just clicked:
            mDownPrevious = true;
        }
        //Every frame the mouse is down:



        var lastPoint = AddPosition(newMouseX, newMouseY);
        var movementX = newMouseX - lastPoint.x;
        var movementY = newMouseY - lastPoint.y;        
        movementX /= mousePositions.length;
        movementY /= mousePositions.length;
        mouseVelX = movementX * 0.3;/// framerate;
        mouseVely = movementY * 0.3; /// framerate;

        //ellipse(lastPoint.x, lastPoint.y, 2, 2);

    }
    else if (mDownPrevious) {
        //Mouse just let go:

        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            projectiles.push(new Projectile(newMouseX, newMouseY, mouseVelX, mouseVely));
        }
        mousePositions = new Array(0);
        mDownPrevious = false;
    }
    UpdateOffset();
    DrawBorders();
}


function DrawBorders() {
    fill(35,35,35);
    noStroke();
    rect(0,0,leftPadding + offsetX, maxHeight);
    rect(leftPadding + offsetX + width, 0, leftPadding - offsetX, maxHeight);
    rect(leftPadding + offsetX - 1, 0, width + 2, upperPadding - offsetY);
    rect(leftPadding + offsetX - 1, upperPadding + height - offsetY, width + 2, upperPadding + offsetY);
    //rect(0, maxWidth,, maxHeight);
}

function DeleteProjectile(index) {
    var deleted = projectiles.splice(index, 1);    
    particles.push(new BangParticle(deleted[0].x, deleted[0].y, deleted[0].deadNormal));

    for (var i = 0; i < 25; i++) {
        particles.push(new SmokeParticle(deleted[0].x, deleted[0].y, deleted[0].deadNormal));
    }
    for (i = 0; i < 7; i++) {
        particles.push(new DebrisParticle(deleted[0].x, deleted[0].y, deleted[0].deadNormal));
    }

    offsetX = deleted[0].x - (width / 2);
    offsetY = deleted[0].y - (height / 2);

    var mometum = (GetDistance(deleted[0].xVel, deleted[0].yVel)^4) * 0.2;

    var dist = GetDistance(offsetX, offsetY);
    offsetX /= dist;
    offsetY /= dist;
    offsetX *= mometum;
    offsetY *= mometum;
  
}
function DeleteParticle(index) {
    particles.splice(index, 1);
}

function AddPosition(xIn, yIn) {
    var last = new Position(xIn, yIn);
    if (mousePositions.length > 0) {
        last = mousePositions[0];
    }
    if (mousePositions.length < mouseSmoothing) {

        mousePositions.push(new Position(xIn, yIn));
    }
    else {
        last = mousePositions.shift();
        mousePositions.push(new Position(xIn, yIn));
    }
    return last;
}


function Position(xIn, yIn) {
    this.x = xIn;
    this.y = yIn;
}

function Projectile(xIn, yIn, xVelIn, yVelIn) {
    this.radius = 16;
    this.x = xIn;
    this.y = yIn;
    this.xVel = xVelIn;
    this.yVel = yVelIn;
    this.direction = 0;
    this.deadNormal = nullNormal;

}
Projectile.prototype.MakeMove = function () {
    if (this.deadNormal === nullNormal) {
        this.x += this.xVel;
        this.y += this.yVel;

        var currentGravity = gravityUp;
        if (this.yVel < 0) {
            currentGravity = gravityDown;
        }
        this.yVel += currentGravity * 1 / framerate;
        //                READABILITY ^ you nonce

        this.direction = rotationFromVectors(this.xVel, this.yVel);


        if (this.x < 0) { 
            this.deadNormal = new Position(1, 0);
            this.x = 0;
        }
        else if (this.x > width) { 
            this.deadNormal = new Position(-1, 0);
            this.x = width;
        }
        else if (this.y < 0) {
            this.deadNormal = new Position(0, 1);
            this.y = 0;
        }
        else if (this.y > height) {
            this.deadNormal = new Position(0, -1);
            this.y = height;
        }
    }
};

Projectile.prototype.Render = function () {

    // ellipse(this.x, height - this.y, 5, 5);

    translate(GetRawPositionX(this.x), GetRawPositionY(this.y));
    rotate(-this.direction);
    image(shellImage, -this.radius / 2, -this.radius / 2, this.radius, this.radius);
    resetMatrix();
};

function rotationFromVectors(xIn, yIn) {
    var directionOut = Math.atan(Math.abs(yIn) / xIn);
    if (xIn < 0)
        directionOut = Math.PI + directionOut;
    if (yIn < 0)
        directionOut = - directionOut;
    document.getElementById("debugText").textContent = "y: " + Math.abs(yIn) + " x: " + xIn + " direction: " + directionOut;
    return directionOut;
}

function BangParticle(xIn, yIn, normalIn) {
    this.x = xIn;
    this.y = yIn;
    this.lifetime = (Math.random() * (0.65 - 0.3) + 0.3);
    this.age = 0;
    this.normal = normalIn;
    this.maxRadius = (Math.random() * (200 - 80)+80);
    this.radius = 0;
    this.alpha = 1;
    this.thickness = 4;
    this.dead = false;
}
BangParticle.prototype.MakeMove = function () {
    if (!this.dead) {
        
        this.age += 1 / framerate;

        this.radius = Math.pow((this.age / this.lifetime),0.35) * this.maxRadius;
        
        this.alpha = 1-(this.age / this.lifetime);
        this.thickness = Math.floor((1 - (this.age / this.lifetime)) * 15);

        if (this.age > this.lifetime) {
            this.dead = true;
        }
    }
};
BangParticle.prototype.Render = function () {
    if (!this.dead) {
        stroke(color(0,0,0,this.alpha*255));
        strokeWeight(this.thickness);
        noFill();
        ellipse(GetRawPositionX(this.x), GetRawPositionY(this.y), this.radius, this.radius);        
    }
};

function SmokeParticle(xIn, yIn, normalIn) {
    this.x = xIn;
    this.y = yIn;
    this.lifetime = (Math.random() * (15 - 2) + 2);
    this.age = 0;
    this.normal = normalIn;    
    this.maxSize = Math.ceil(Math.random() * 40);    
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = ((Math.random() * 2) - 1) * 0.8;
    this.size = this.maxSize;
    this.dead = false;
    this.speedX = ((Math.random() * 2) - 1) * 140;
    this.speedY = ((Math.random() * 2) - 1) * 140;

}
SmokeParticle.prototype.MakeMove = function () {
    if (!this.dead) {
        this.age += 1 / framerate;

        this.rotation += this.rotationSpeed / framerate;
        this.size = Math.floor((1 - Math.pow(this.age / this.lifetime, 2)) * this.maxSize);
        if (this.size < 1) {
            this.size = 1;
        }

        this.x += (this.speedX / framerate);
        this.y += (this.speedY / framerate);
        this.speedX *= (1 - (1 / framerate) * 2);
        this.speedY *= (1 - (1 / framerate) * 2);

        

        this.age += 1 / framerate;
        if (this.age > this.lifetime) {
            this.dead = true;
        }

        const deleteZone = this.size;
        if (this.x < -deleteZone || this.x > width + deleteZone || this.y < -deleteZone || this.y > height + deleteZone) {
            this.dead = true;
        }        
    }
};

SmokeParticle.prototype.Render = function () {
    if (!this.dead) {
        translate(GetRawPositionX(this.x), GetRawPositionY(this.y));
        rotate(this.rotation);
        image(cloudImage, -this.size / 2, -this.size / 2, this.size, this.size);
        resetMatrix();
    }
};

function DebrisParticle(xIn, yIn, normalIn) {
    this.x = xIn;
    this.y = yIn;
    this.normal = normalIn;
    this.maxSize = Math.ceil(Math.random() * 7);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = ((Math.random() * 2) - 1) * 6;
    this.size = this.maxSize;
    this.dead = false;

    var launchSpeed = Math.random() * 550;
    this.velX = normalIn.x * launchSpeed;
    this.velY = normalIn.y * launchSpeed;
    var rotateAngle = (Math.random() * Math.PI) - (Math.PI/2);
    var newVectors = rotateVectors(this.velX, this.velY, rotateAngle);
    this.velX = newVectors.x;
    this.velY = newVectors.y;    
}

function rotateVectors(xIn, yIn, thetaRad) {
    var cs = Math.cos(thetaRad);
    var sn = Math.sin(thetaRad);

    var newX = xIn * cs - yIn * sn;
    var newY = xIn * sn + yIn * cs;

    return new Position(newX, newY);
}


DebrisParticle.prototype.MakeMove = function () {
    if (!this.dead) {

        this.rotation += this.rotationSpeed / framerate;

        this.x += this.velX / framerate;
        this.y += this.velY / framerate;
        this.velY += gravityUp;

        const deleteZone = 10;
        if (this.x < -deleteZone || this.x > width + deleteZone || this.y < -deleteZone || this.y > height + deleteZone) {
            this.dead = true;
        }        
    }
};

DebrisParticle.prototype.Render = function () {
    if (!this.dead) {
        translate(GetRawPositionX(this.x), GetRawPositionY(this.y));
        rotate(this.rotation);
        image(debrisImage, -this.size / 2, -this.size / 2, this.size, this.size);
        resetMatrix();
    }
};

function GetRawPositionX(xIn) {
    return xIn + leftPadding + offsetX;
}
function GetRawPositionY(yIn) {
    return height - (yIn - upperPadding + offsetY);
}

function GetPositionFromRawX(xIn) {
    return xIn - leftPadding - offsetX;
}
function GetPositionFromRawY(yIn) {
    return height - (yIn - upperPadding + offsetY);
}

function UpdateOffset() {
    const maxOffset = 5;
    var dist = GetDistance(offsetX, offsetY);
    if (dist > maxOffset) {
        offsetX /= dist;
        offsetY /= dist;
        offsetX *= maxOffset;
        offsetY *= maxOffset;
    }
    const springyness = 15;
    const damping = 10;

    offsetVelX += -offsetX * springyness;
    offsetVelY += -offsetY * springyness;

    offsetVelX *= 1 - ((1 / framerate) * damping);
    offsetVelY *= 1 - ((1 / framerate) * damping);

    offsetX += offsetVelX / framerate;//(1 - (1 / frameRate) * damping);
    offsetY += offsetVelY / framerate;//(1 - (1 / frameRate) * damping);
}

function GetDistance(xIn, yIn) {
    return Math.sqrt((xIn * xIn) + (yIn * yIn));
}


