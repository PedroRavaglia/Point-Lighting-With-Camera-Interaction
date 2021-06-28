
// Matrix functions to handle 3D manipulations:



// 4x4 Identity matrix
function identetyMat_3D() {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]
}

// Translation matrix
function transMat_3D(dx, dy, dz) {
    return [
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0,  1]
    ]
}

// Scale Matrix
function scaleMat_3D(sx, sy, sz) {
    return [
        [sx,  0,  0, 0],
        [0 , sy,  0, 0],
        [0 ,  0, sz, 0],
        [0 ,  0,  0, 1]
    ]
}

// Rotation matrices of each axis:

function xRotation(angle) {
    const radian = angle * Math.PI / 180;
    const [c, s] = [Math.cos(radian), Math.sin(radian)]
    return [
        [1,  0, 0, 0],
        [0,  c, s, 0],
        [0, -s, c, 0],
        [0,  0, 0, 1]
    ]
}

function yRotation(angle) {
    const radian = angle * Math.PI / 180;
    const [c, s] = [Math.cos(radian), Math.sin(radian)]
    return [
        [c, 0, -s, 0],
        [0, 1,  0, 0],
        [s, 0,  c, 0],
        [0, 0,  0, 1]
    ]
}

function zRotation(angle) {
    const radian = angle * Math.PI / 180;
    const [c, s] = [Math.cos(radian), Math.sin(radian)]
    return [
        [ c, s, 0, 0],
        [-s, c, 0, 0],
        [ 0, 0, 1, 0],
        [ 0, 0, 0, 1]
    ]
}


// Returns the multiplication of 4x4 matrices A and B
function MatrixMult_4x4(A, B) {
    let C = [[], [], [], []]; // the product of A and B
    let elem = 0; // variable to alocate each element of the new matrix

    // 'line' is the line of A in wich we are making the operations
    let line = 0;
    while(line < 4) {
        // i and j will iterate through the matrix length
        for(let i=0; i<4; ++i) {
            for(let j=0; j<4; ++j){
                elem += A[line][j] * B[j][i]; 

                // After the iteration of j (when j=2) 'elem' will be the element of the matrix in [a, i]                              
                if(j == 3) {
                    C[line].push(elem);
                    elem = 0; // We need to reseat 'elem' to calculate other elements of the matrix
                }
            }
        }
        line += 1;
    }
    return C
}

// Converts a 4x4 matrix to an array so that it can be handled by GLSL
function matrix2Array_3D(A) {
    let B = [];
    for(let i=0; i<4; i++) {
        for(let j=0; j<4; j++) {
            B.push(A[j][i])
        }
    }
    return B
}


// The perspective matrix that transforms the view frustum to the Canonical view volume
function perspective(fieldOfView, aspect, near, far) {
    const fieldOfViewInRadians = fieldOfView * Math.PI / 180;
    const c = Math.tan(Math.PI/2 - fieldOfViewInRadians/2);

    return [
        [c/aspect, 0,                         0,                       0],
        [       0, c,                         0,                       0],
        [       0, 0, (near + far)/(near - far), 2*far*near/(near - far)], 
        [       0, 0,                        -1,                       0]
    ];
}




// Matrix functions to handle the camera in a 3D environment:



// Returns the vector produced by the cross product between a and b
function crossProduct(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
}

// Returns the subtraction of a by b
function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

// Returns the vector divided by its legth, so we get the vector normalized
function normalize(v) {
    let length = Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2));

    // Make sure we don't divide by 0
    if(length > 0.00001) {
        return [v[0]/length, v[1]/length, v[2]/length];
    } else {
        return [0, 0, 0];
    }
}

// With this matrix we can decide where we want the camera to be, with 'cameraPosition', and
// where to look, with 'target'. We also set in which way is up, so we can easily compute the
// axis of the camera. This matrix is just a change of coordinates matrix from the world frame
// to the camera frame.
function lookAt(cameraPosition, target, up) {
    let zAxis = normalize(subtractVectors(cameraPosition, target));
    let xAxis = normalize(crossProduct(up, zAxis));
    let yAxis = crossProduct(zAxis, xAxis);

    let M = [
        [xAxis[0], yAxis[0], zAxis[0], cameraPosition[0]],
        [xAxis[1], yAxis[1], zAxis[1], cameraPosition[1]],
        [xAxis[2], yAxis[2], zAxis[2], cameraPosition[2]],
        [       0,        0,        0,                 1]
    ];
    return M;
}

// Computes the inverse of the camera matrix (lookAt), so we can create a matrix that moves
// everything in the opposite side of the camera. So, instead of actually moving the camera,
// we're going to do the reverse movement in the environment to create the illusion of the 
// desired camera movement.
// Since lookAt is constructed from an orthonormal frame, there is a easy way to compute the 
// inverse. In particular, the upper 3x3 portion of the matrix (R) can be inverted by taking 
// its transpose.
function inverseLookAt(M) {
    let T = [
        [1, 0, 0, -M[0][3]],
        [0, 1, 0, -M[1][3]],
        [0, 0, 1, -M[2][3]],
        [0, 0, 0,        1]
    ];
    let R = [
        [M[0][0], M[0][1], M[0][2], 0],
        [M[1][0], M[1][1], M[1][2], 0],
        [M[2][0], M[2][1], M[2][2], 0],
        [      0,       0,       0, 1]
    ]
    let R_t = transpose_4x4(R);

    return MatrixMult_4x4(R_t, T);
}


// Returns the matrix transposed, that is, it switches the row and column 
// indices of the matrix
function transpose_4x4(M) {
    let M_t = [[], [], [], []];

    for(let i=0; i < M.length; i++) {
        for(let j=0; j < M.length; j++) {
            M_t[i].push(M[j][i]);
        }
    }
    return M_t;
}