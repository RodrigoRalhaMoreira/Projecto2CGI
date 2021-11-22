import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten } from "../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multRotationX, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix} from "../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';

/** @type WebGLRenderingContext */
let gl;

let mode;
let ucolor;
const VP_DISTANCE = 12;
const LINE_SIZE = 20;
const WHEELS = 8;
const WHEEL_INITIAL_POS_X = 0.0;
var lookAtX = VP_DISTANCE;
var lookAtY = VP_DISTANCE;
var lookAtZ = VP_DISTANCE;
var normalX = 0;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    ucolor = gl.getUniformLocation(program, "ucolor");

    mode = gl.LINES; 

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    
    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                mode = gl.LINES; 
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case '4':
                lookAtX = 0;
                normalX = 1;
                lookAtY = VP_DISTANCE;
                lookAtZ = 0;
                break;
            case '3':
                lookAtZ = 0;
                lookAtY = 0;
                lookAtX = VP_DISTANCE;
                normalX = 1;
                break;
            case '2':
                lookAtZ = 0;
                lookAtX = 0;
                lookAtY = 0;
                normalX = 0;
                break;
            case '1':
                lookAtX = VP_DISTANCE;
                lookAtY = VP_DISTANCE;
                lookAtZ = VP_DISTANCE;
                normalX = 0;
                break;
            case '-':
                if(animation) speed /= 1.1;
                break;
        }
    }
    

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CYLINDER.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function LineBoard()
    {   
        for(var i = 0; i < LINE_SIZE; i++){
            multTranslation([1.0,0.0,0.0]);

            // Send the current modelview matrix to the vertex shader
            uploadModelView();

            // Draw a cube
            CUBE.draw(gl, program, mode);
        }
    }
    function Board()
    {   
        multScale([1.0, 0.5, 1.0]);
        var changeLine = -LINE_SIZE/2.0;
        gl.uniform4fv(ucolor, [1.0,1.0,1.0,1.0]);
        for(var i = 0; i < LINE_SIZE; i++){
            pushMatrix();
            multTranslation([-LINE_SIZE/2.0, 0.0, changeLine]);
            LineBoard();
            changeLine++;
            popMatrix();
        }
    }
    function Wheel() {
        multTranslation([0.0, 1.0, 0.0]);
        multRotationX(90); 
        multScale([1.0, 1.0, 1.0]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        TORUS.draw(gl, program, mode);
    }

    function Wheels(){
        gl.uniform4fv(ucolor, [0.0,1.0,1.0,1.0]);
        var z = 2.0;
        var x = WHEEL_INITIAL_POS_X;
        for(var i = 0; i < WHEELS; i++){
            pushMatrix()
            if(i == 4) {
                z = -1.0;
                x = WHEEL_INITIAL_POS_X;
            }
            x += 1.5;
            multTranslation([x,0.0,z]);
            Wheel();
            popMatrix();
        }
    }

    function Axis() {
        multTranslation([0.0, 1.0, 0.0]);
        multRotationX(90); 
        multScale([1.0, 1.0, 1.0]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
    }

    function WheelsAxles() {
        gl.uniform4fv(ucolor, [1.0,0.5,0.7,1.0]);
        var z = 2.0;
        var x = WHEEL_INITIAL_POS_X;
        for(var i = 0; i < WHEELS; i++){
            pushMatrix()
            if(i == 4) {
                z = -1.0;
                x = WHEEL_INITIAL_POS_X;
            }
            x += 1.5;
            multTranslation([x,0.0,z]);
            Axis();
            popMatrix();
        }
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt([lookAtX,lookAtY,lookAtZ], [0,0,0], [normalX,1,0]));
        
        pushMatrix();   
        Board();
        popMatrix();
        pushMatrix();
        Wheels();
        popMatrix();
        pushMatrix();
        WheelsAxles();
        popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
