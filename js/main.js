
const regl = createREGL(canvas);

// Loading 3D models.
var bunny = parseOBJ(await (await fetch('../objs/bunny.obj')).text());
var sphere = parseOBJ(await (await fetch('../objs/sphere.obj.txt')).text());
var cube = parseOBJ(await (await fetch('../objs/cube.txt')).text());


var objects = [bunny, sphere, cube];
var options = ['Bunny', 'Sphere', 'Cube'];

// Variable that will contain the regl instance.
let drawObject = changeObj(objects[0]);



//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------



// Function that generates a regl instance with the specified object data, where
// we will write the vertex and fragment shaders.
function changeObj(data) {
    var drawObject = regl({
        vert: `
        attribute vec3 a_position, a_normal;
    
        uniform vec3 u_lightWorldPosition;
        uniform vec3 u_viewWorldPosition;

        uniform mat4 u_worldViewProjection;
        uniform mat4 u_world;
        uniform mat4 lightRotation;
    
        varying vec3 v_surfaceToLight;
        varying vec3 v_surfaceToView;
        varying vec3 v_normal;
        void main() {
            // Multiplies the position by the matrix.
            gl_Position = u_worldViewProjection * vec4(a_position, 1);

            // Reorients normals and pass to the fragment shader.
            v_normal = (u_world * vec4(a_normal, 1)).xyz;
            
            // Computes the world position of the surface.
            vec3 surfaceWorldPosition = mat3(u_world) * a_position;

            // Rotates the light.
            vec3 rotatedLight = mat3(lightRotation) * u_lightWorldPosition;

            // Computes the vector of the surface to the light and pass it to
            // the fragment shader.
            v_surfaceToLight = rotatedLight - surfaceWorldPosition;

            // Computes the vector of the surface to the view/camera and pass
            // it to the fragment shader.
            v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
        }
        `,
    
        frag: `
        precision mediump float;
    
        uniform vec4 u_color;
        uniform float u_shininess;
        uniform vec3 u_lightColor;
        uniform vec3 u_specularColor;
    
        varying vec3 v_surfaceToLight;
        varying vec3 v_surfaceToView;
        varying vec3 v_normal;
        void main() {
            // Normalizes all vectors and compute the 'halfVector' that we'll use
            // to compute the specular light. 
            vec3 normal = normalize(v_normal);
            vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
            vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    
            // Computes the 'light' variable by making the dot product between 'normal'
            // and 'surfaceToLightDirection' vectors.
            float light = dot(normal, surfaceToLightDirection);

            // Computes the 'specular' variable by making the dot product between 'normal'
            // and 'halfVector' vectors only when the light source is facing this part of
            // the object.
            float specular = 0.0;
            if (light > 0.0) {
                specular = pow(dot(normal, halfVector), u_shininess);
            }
    
            gl_FragColor = u_color;

            // Lets multiply just the color portion (not the alpha) by the light.
            gl_FragColor.rgb *= light * u_lightColor;

            // Just add in the specular.
            gl_FragColor.rgb += specular * u_specularColor;
        }
        `,
    
        attributes: {
            a_position: data.position,
            a_normal: data.normal
        },
    
        uniforms: {
            u_worldViewProjection : regl.prop('u_worldViewProjection'), // Matrix that will control what to be shown and how on the screen
            u_world: regl.prop('u_world'), // Matrix containing all world transformation information.
            u_color: [0.2, 1, 0.2, 1], // Color of the 3D model.
            u_lightWorldPosition: regl.prop('u_lightWorldPosition'), // Point where the light will be located.
            lightRotation: regl.prop('lightRotation'), // Angle to rotate the light with respect to the y axis.
            u_viewWorldPosition: regl.prop('u_viewWorldPosition'), // Point where the camera will be located.
            u_shininess: regl.prop('u_shininess'), // Variable that wil control the brightness of the light.
            u_lightColor: [1, 0.6, 0.6],
            u_specularColor: [1, 0.2, 0.2]
        },
    
        count: data.position.length / 3
    })

    return drawObject;
}


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------


// SETTING UI
let settings = {
    fieldOfView: 25,
    cameraX: 0,
    cameraY: 40,
    yTrans: -5,
    yLight: 14,
    shininess: 150
}

webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    {type: 'slider', key: 'fieldOfView', name: 'Field of View', min: 0,    max: 179, slide: (event, ui) => {settings.fieldOfView = ui.value}},
    {type: 'slider', key: 'cameraX', name: 'Camera X',          min: -360, max: 360, slide: (event, ui) => {settings.cameraX = ui.value}},
    {type: 'slider', key: 'cameraY', name: 'Camera Y',          min: -200, max: 200, slide: (event, ui) => {settings.cameraY = ui.value}},
    {type: 'slider', key: 'yTrans', name: 'Translation Y',      min: -60,  max: 60,  slide: (event, ui) => {settings.yTrans = ui.value}},
    {type: 'slider', key: 'yLight', name: 'Light Y',            min: -60,  max: 60,  slide: (event, ui) => {settings.yLight = ui.value}},
    {type: 'slider', key: 'shininess', name: 'Shininess',       min: 1,    max: 300, slide: (event, ui) => {settings.shininess = ui.value}},
    {type: 'option', key: 'objects_index', name: '3D Models',   options: options,    change: (event, ui) => {drawObject = changeObj(objects[settings.objects_index])}}
]);


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------


// Returns a matrix containing all world transformation information, so we can update the world  
// position of each vertex, and reorient all normal vectors as objects are reoriented.
function setWorldMatrix(x_obj_Rot, y_obj_Rot, z_obj_Rot, y_Trans) {
    let worldMatrix = MatrixMult_4x4(transMat_3D(0, y_Trans, 0), xRotation(x_obj_Rot));
    worldMatrix = MatrixMult_4x4(worldMatrix, yRotation(y_obj_Rot));
    worldMatrix = MatrixMult_4x4(worldMatrix, zRotation(z_obj_Rot));
    worldMatrix = MatrixMult_4x4(worldMatrix, scaleMat_3D(10, 10, 10));

    return worldMatrix;
}

// Returns a matrix that will control what to be shown and how on the screen
function setWorldViewProjectionMatrix(fieldOfView, aspect, zNear, zFar, x_obj_Rot, y_obj_Rot, z_obj_Rot, x_Cam, y_Cam, z_Cam, y_Trans, Cam_x_Rot, Cam_y_Rot) {
    // Computes the projection matrix
    let projectionMatrix = perspective(fieldOfView, aspect, zNear, zFar);

    // Computes the camera's matrix
    let cameraPosition = [x_Cam, y_Cam, z_Cam];
    let up = [0, 1, 0];
    let cameraTarget = [0, 0, 0];
    let camera_Matrix = lookAt(cameraPosition, cameraTarget, up);

    // Rotates the camera
    camera_Matrix = MatrixMult_4x4(xRotation(Cam_x_Rot), camera_Matrix);
    camera_Matrix = MatrixMult_4x4(yRotation(Cam_y_Rot), camera_Matrix);

    // Make a view matrix from the camera matrix
    let viewMatrix = inverseLookAt(camera_Matrix);

    // Computes a view projection matrix
    let viewProjectionMatrix = MatrixMult_4x4(projectionMatrix, viewMatrix);

    // Computes the worlds matrix
    let worldMatrix = setWorldMatrix(x_obj_Rot, y_obj_Rot, z_obj_Rot, y_Trans);

    // Multiplies the matrices
    let worldViewProjectionMatrix = MatrixMult_4x4(viewProjectionMatrix, worldMatrix);

    return matrix2Array_3D(worldViewProjectionMatrix);
}



// Drawing in the canvas with updated variables by frame.
regl.frame(() => {
    const aspect = canvas.width / canvas.height;

    regl.clear({
        color: [0.7, 0.5, 0.9, 1],
        depth: 1
    })

    drawObject({
        u_worldViewProjection : setWorldViewProjectionMatrix(
            settings.fieldOfView,
            aspect, 
            0.1, 
            2000, 
            obj_Rot.x, 
            obj_Rot.y, 
            obj_Rot.z,
            settings.cameraX,
            settings.cameraY,
            camera_z,
            settings.yTrans,
            cameraRot.x,
            cameraRot.y
        ),

        u_world: matrix2Array_3D(
            setWorldMatrix(obj_Rot.x, obj_Rot.y, obj_Rot.z, settings.yTrans)
        ),

        lightRotation: matrix2Array_3D(yRotation(light.y_Rot)),
        u_lightWorldPosition: [20, settings.yLight, 60],
        u_viewWorldPosition: [0, 40, camera_z],
        u_shininess: parseFloat(settings.shininess)
    })
})

    

