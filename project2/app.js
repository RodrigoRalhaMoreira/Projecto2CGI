import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, rotateY } from "../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multRotationX, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix} from "../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';

/** @type WebGLRenderingContext */
let gl;

let mode;
let ucolor;
const VP_DISTANCE = 10;//12;
const LINE_SIZE = 20;
const AXLES = 4;
const WHEEL_INITIAL_POS_X = 0.2;
var lookAtX = VP_DISTANCE;
var lookAtY = VP_DISTANCE;
var lookAtZ = VP_DISTANCE;
var normalX = 0;
var normalY = 1;
var boardReds = [];
var boardGreens = [];
var boardBlues = [];
var movingTank = 0.0;
const MOVING_TANK_INC = 0.1;
const WHEEL_ANGLE_INC = 360 * MOVING_TANK_INC / (2 * Math.PI * 0.7 * 1.1); //0.7 wheel radius and 1.1 scale 
var wheelAngle = 0;
var tankAngle = 0;
var tankHorizontalAngle = 0;
const TANK_MIN_ANGLE = -13; 
const TANK_MAX_ANGLE = 15; 

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
            case 'W':
                mode = gl.LINES; 
                break;
            case 'S':
                mode = gl.TRIANGLES;
                break;
            case '4':
                normalX = -1;
                normalY = 0;
                lookAtX = 0;
                lookAtY = VP_DISTANCE;
                lookAtZ = 0;
                break;
            case '3':
                lookAtZ = 0;
                lookAtY = 0;
                lookAtX = VP_DISTANCE;
                normalX = 1;
                normalY = 1;
                break;
            case '2':
                lookAtZ = 0;
                lookAtX = 0;
                lookAtY = 0;
                normalX = 0;
                normalY = 1;
                break;
            case '1':
                lookAtX = VP_DISTANCE;
                lookAtY = VP_DISTANCE;
                lookAtZ = VP_DISTANCE;
                normalX = 0;
                normalY = 1;
                break;
            case 'ArrowUp':
                if(movingTank > -(LINE_SIZE/2.0 + 0.5)){ 
                    movingTank -= MOVING_TANK_INC;
                    wheelAngle -= WHEEL_ANGLE_INC;
                }
                break;
            case 'ArrowDown':
                if(movingTank < (LINE_SIZE/2.0) - 6){
                    movingTank += MOVING_TANK_INC; 
                    wheelAngle += WHEEL_ANGLE_INC;
                }
                break;
            case 'w':
                if(tankAngle > TANK_MIN_ANGLE) tankAngle-= 1;
                break;
            case 's':
                if(tankAngle < TANK_MAX_ANGLE)tankAngle += 1;
                break;
            case 'a':
               tankHorizontalAngle -= 1;
                break;
            case 'd':
                tankHorizontalAngle += 1;
                break;
        }
    }
    
    gl.clearColor(0.9, 0.8, 0.7, 1.0);
    CYLINDER.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);
    SPHERE.init(gl);
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
    {   var r,g,b;
        for(var i = 0; i < LINE_SIZE; i++){
            if(boardBlues.length < LINE_SIZE){
                r = Math.random() * 0.5;
                g = Math.random() * 0.15;
                b = Math.random() * 0.15;
                gl.uniform4fv(ucolor, [0.8 + r,0.6+ g,0.15+ b,1.0]);
                boardReds[i] = r;
                boardGreens[i] = g;
                boardBlues[i] = b;
           }
           else {
           gl.uniform4fv(ucolor, [0.8 + boardReds[i],0.6 + boardGreens[i],0.15+ boardBlues[b],1.0]);
           }
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
        multRotationZ(wheelAngle);
        multRotationX(90); 
        multScale([1.1, 1.1, 1.1]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        TORUS.draw(gl, program, mode);
    }

    function Wheels(){
        gl.uniform4fv(ucolor, [0.14,0.14,0.14,1.0]);
        pushMatrix();
        multTranslation([0.0, 0.0, -2.0]);
        Wheel();
        popMatrix();
        pushMatrix();
        multTranslation([0.0, 0.0, 1.0]);
        Wheel();
        popMatrix();
    }

    function Axle() {
        gl.uniform4fv(ucolor, [0.17,0.25,0.21,1.0]);
        pushMatrix();
        multTranslation([0.0, 1.0, -0.5]);
        multRotationZ(wheelAngle);
        multRotationX(90); 
        multScale([0.6, 3.0, 0.6]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        // Draw the two associated wheels
       Wheels();
    }

    function WheelsAxles() {
        var z = 2.0;
        var x = WHEEL_INITIAL_POS_X;
        for(var i = 0; i < AXLES; i++){
            pushMatrix()
            if(i == 4) {
                z = -1.0;
                x = WHEEL_INITIAL_POS_X;
            }
            x += 1.5;
            multTranslation([x,0.0,z]);
            Axle();
            popMatrix();
        }
    }
    function drawTank() {
        pushMatrix();
            BottomPart();
        popMatrix();
        pushMatrix();
            MiddlePart();
        popMatrix();
        pushMatrix();
            TopPart();
        popMatrix();
    }

    function BottomPart() {
        pushMatrix();
        WheelsAxles();
        popMatrix();
    }
    
    function BackBodyPart() {
        pushMatrix();
        gl.uniform4fv(ucolor, [0.14,0.22,0.0,1.0]);
        multTranslation([6.0, 1.2, 1.5]);
        multRotationZ(65); 
        multScale([1.0, 1.5, 2.3]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function FrontBodyPart() {
        pushMatrix();
        gl.uniform4fv(ucolor, [0.14,0.22,0.0,1.0]);
        multTranslation([2.0, 1.2, 1.5]);
        multRotationZ(-65); 
        multScale([1.0, 1.5, 2.3]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function TankBodyLow() {
        gl.uniform4fv(ucolor, [0.13,0.20,0.0,1.0]);
        multTranslation([3.8, 1.0, 1.5]);
        multScale([4.5, 1.0, 2.2]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }

    function TankBodyHigh() {
        gl.uniform4fv(ucolor, [0.14,0.22,0.0,1.0]);
        multTranslation([4.0, 1.5, 1.5]);
        multScale([3.05, 1.0, 2.3]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }

    function MiddlePart() {
        pushMatrix();
        TankBodyLow();
        popMatrix();
        pushMatrix();
        BackBodyPart();
        popMatrix();
        pushMatrix();
        FrontBodyPart();
        popMatrix();
        pushMatrix();
        TankBodyHigh();
        popMatrix();
    }
    
    function TopCircleBase(){
        gl.uniform4fv(ucolor, [0.17,0.62,0.41,1.0]);
        multTranslation([4.0, 2.0, 1.5]);
        multScale([2.1, 0.2, 2.2]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        SPHERE.draw(gl, program, mode);
    }

    function TopCircle(){
        gl.uniform4fv(ucolor, [0.0,0.0,1.0,1.0]);
        multTranslation([4.2, 2.4, 1.5]);
        multScale([1.4, 1.2, 1.4]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        SPHERE.draw(gl, program, mode);
    }
    

    function InclinedSquare() {
        gl.uniform4fv(ucolor, [0.10,0.37,0.25,1.0]);
        multTranslation([3.9, 2.2, 1.5]);
        multRotationZ(55); 
        multScale([1.05, 1.0, 1.4]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }

    function HeadRectangle() {
        gl.uniform4fv(ucolor, [0.10,0.37,0.25,1.0]);
        multTranslation([4.8, 2.65, 1.5]);
        multScale([2.0, 0.7, 1.4]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }
    function HeadCircle(){
        gl.uniform4fv(ucolor, [0.29,0.22,0.09,1.0]);
        multTranslation([4.3, 3.0, 1.7]);
        multScale([1.0, 0.5, 1.0]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        SPHERE.draw(gl, program, mode);
    }

    function Antenne(){
        gl.uniform4fv(ucolor, [0.0,0.0,0.0,1.0]);
        multScale([0.02, 2.0, 0.02]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
    }
    function Antennes(){
        pushMatrix();
        multTranslation([3.9, 3.95, 0.9]);
        Antenne();
        popMatrix();
        pushMatrix();
        multTranslation([3.9, 3.95, 2.1]);
        Antenne();
        popMatrix();
    }
    function TopRectangle(){
        pushMatrix();
            InclinedSquare();
        popMatrix();
        pushMatrix();
            TopCircle();
        popMatrix();
        pushMatrix();
            HeadRectangle();
        popMatrix();
        pushMatrix();
            HeadCircle();
        popMatrix();
        pushMatrix();
            Antennes();
        popMatrix();
        pushMatrix();
            Canon();
        popMatrix();
    }

    function LargeCanonPart() {
        gl.uniform4fv(ucolor, [0.29,0.22,0.09,1.0]);
        multTranslation([3.55, 2.65, 1.5]);
        multRotationZ(90); 
        multScale([0.4, 0.6, 0.6]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
    }

    function LongCanonPart() {
        gl.uniform4fv(ucolor, [0.19,0.23,0.15,1.0]);
        multTranslation([1.45, 2.65, 1.5]);
        multRotationZ(90); 
        multScale([0.3, 3.6, 0.2]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
    }

    function BulletCanonPart() {
        
        pushMatrix();
        gl.uniform4fv(ucolor, [0.0,0.0,0.0,1.0]);
        multTranslation([0.0, 2.65, 1.5]);
        multScale([0.5, 0.35, 0.3]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
        popMatrix();
        
        pushMatrix();
        gl.uniform4fv(ucolor, [0.13,0.18,0.21,1.0]);
        multTranslation([-0.3, 2.65, 1.5]);
        multScale([0.1, 0.4, 0.5]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function Canon(){
        pushMatrix();
        LargeCanonPart();
        popMatrix();
        pushMatrix();
        LongCanonPart();
        popMatrix();
        pushMatrix();
        BulletCanonPart();
        popMatrix();
    }

    function TopPart(){
        pushMatrix();
        TopCircleBase();
        popMatrix();
        pushMatrix();
        multTranslation([4.2, 2.4, 1.5]);
        multRotationZ(tankAngle);
        multTranslation([-4.2, -2.4, -1.5]);
        multTranslation([4.2, 2.4, 1.5]);
        multRotationZ(-tankAngle);
        multRotationY(tankHorizontalAngle);
        multRotationZ(tankAngle);
        multTranslation([-4.2, -2.4, -1.5]);
        TopRectangle();
        popMatrix();
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt([lookAtX,lookAtY,lookAtZ], [0,0,0], [normalX,normalY,0]));
        
        pushMatrix();   
        Board();
        popMatrix();
        pushMatrix();   
        multTranslation([movingTank,0.0,0.0]);
        drawTank();
        popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
