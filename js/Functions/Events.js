
// Setting all the canvas and window events



var canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl');

if (!gl){
    console.log("Not ennable to run WebGL with this browser")
}

// Setting the size of canvas when loading the page to fully fit it
window.addEventListener('load', () => {
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
})

// Resizing canvas when page is resized 
window.addEventListener('resize', () => {
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
})


// Variables that will handle all the interactive events in the canvas:


// Variables that will contain the axis rotations
let cameraRot = {
    x: 0,
    y: 0,
    z: 0
}

// Variable that will contain the mouse coordinates
let mouse = {
    x: 0,
    y: 0
}

// That will indicate when the mouse is clicked (1) or not (0)
let clicked;

// That will contain the coordinates of the point first clicked to move the object
let firstClick = {
    x: 0,
    y: 0
}

// That will indicate the direction of mouse movement
let direction = {
    x: 'right',
    y: 'up'
}

// Camera position in the z axis
let camera_z = 135;

// CANVAS EVENTS:

// The first event is to set the coordinates of firstClick when pressed the mouse button and 
// change 'clicked' to a true value
document.addEventListener('mousedown', (event) => {
    firstClick.x = event.layerX;
    firstClick.y = event.layerY;
    clicked = 1;
})

// When the mouse button is up we set the clicked variable to 0
document.addEventListener('mouseup', (event) => {
    clicked = 0;
})

// Make the object rotate according to the mouse movement when the mouse button is down 
document.addEventListener('mousemove', (event) => {
    const x = event.layerX;
    const y = event.layerY;

    // Distances between 'firstClick' and mouse coordinates (values that we will use to
    // rotate the camera)
    let dist = {
        x: x - firstClick.x,
        y: y - firstClick.y
    }

    // When we change the movement direction, like right to left, we also want the camera to automatically
    // change the direction of its rotation. Thus, to do that, when you are pressing the mouse button, and you 
    // change the direction of the mouse movement, it updates the direction and firstClick variables.
    if (x < mouse.x && clicked == 1 && direction.x == 'right') {
        firstClick.x = x;
        direction.x = 'left';
    }
    if (x > mouse.x && clicked == 1 && direction.x == 'left') {
        firstClick.x = x;
        direction.x = 'right';
    }
    if (y < mouse.y && clicked == 1 && direction.y == 'down') {
        firstClick.y = y;
        direction.y = 'up';
    }
    if (y > mouse.y && clicked == 1 && direction.y == 'up') {
        firstClick.y = y;
        direction.y = 'down';
    }


    // Change 'clicked' to 0 when the mouse is in the ui area of the canvas
    if (event.clientX > canvas.width - 300 && event.clientY < 160) {
        clicked = 0;
    }

    // Change the camera angle only when the mouse button is pressed
    const cte = 40;
    if (clicked == 1) {
        cameraRot.y += dist.x/cte;
        cameraRot.x += dist.y/cte;
    }
    
    // Update the last mouse coordinates
    mouse.x = x;
    mouse.y = y;
})

// Setting the z coordinate of the camera with the mouse wheel
document.addEventListener('mousewheel', (event) => {
    camera_z -= event.wheelDelta/10;
})



// Rotation to each axis of the object
let obj_Rot = {
    x: 0,
    y: 0,
    z: 0
}

// Change position of the light
let light = {
    y_Rot: 0
}

// Constants that will control the velocity of object and light moviments
let cte_obj = 7;
let cte_light = 11;

// Setting key commands to rotate the object in the x or y axis using arrow keys
// or 'WASD'; and also to rotate the light position in the y axis with Q or E
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            obj_Rot.x += cte_obj;
            break;

        case 'ArrowDown':
        case 'KeyS':
            obj_Rot.x -= cte_obj;
            break;

        case 'ArrowRight':
        case 'KeyD':
            obj_Rot.y -= cte_obj;
            break;

        case 'ArrowLeft':
            case 'KeyA':
                obj_Rot.y += cte_obj;
                break;
        
        case 'KeyQ':
            light.y_Rot += cte_light;
            break;

        case 'KeyE':
            light.y_Rot -= cte_light;
            break;
    }
})