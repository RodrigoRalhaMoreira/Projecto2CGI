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

//for the scales
const BOARD_X_S = 1.0;
const BOARD_Y_S = 0.5;
const BOARD_Z_S = 1.0;
const WHEEL_X_S = 1.1;
const WHEEL_Y_S = 1.1;
const WHEEL_Z_S = 1.1;
const AXLE_X_S = 0.6;
const AXLE_Y_S =  3.0;
const AXLE_Z_S = 0.6;

const TANK_BL_X_S = 3.2;
const TANK_BL_Y_S = 1.0;// * 2;
const TANK_BL_Z_S = 2.2 ;
//BBP = back body part
const BBP_X_S = 1.0;// *2;
const BBP_Y_S = 1.5;
const BBP_Z_S = TANK_BL_Z_S;
//FBP = front body part
const FBP_X_S = 1.0;
const FBP_Y_S = 1.5;
const FBP_Z_S = TANK_BL_Z_S;

const TORUS_RADIUS = 0.5;
const TORUS_DISK_RADIUS = 0.2;
const TORUS_TOTAL_RADIUS = TORUS_RADIUS + TORUS_DISK_RADIUS; // considering the center of the circle 

//for the translations
const BOARD_CUBE_Y_T = 0.0;
const BOARD_CUBE_Z_T = 0.0;

const WHEEL_X_T = 0.0;
const WHEEL_Y_T =  WHEEL_Z_S * TORUS_TOTAL_RADIUS;
const WHEEL_Z_T = 0.0;

const AXLE_X_T = 0.0;
const AXLE_Y_T =  WHEEL_Z_S * TORUS_TOTAL_RADIUS;
const AXLE_Z_T = -0.5;

const TANK_BL_X_T = 4.0;
const TANK_BL_Y_T = AXLE_Y_T + TANK_BL_Y_S/2 + AXLE_Z_S/2;
const TANK_BL_Z_T = 1.5;

const BBP_X_T = TANK_BL_X_T + TANK_BL_X_S/2 + BBP_X_S/2;
const BBP_Y_T = TANK_BL_Y_T - (BBP_Y_S/2 - TANK_BL_Y_S/2);
const BBP_Z_T = TANK_BL_Z_T;

const FBP_X_T = TANK_BL_X_T - TANK_BL_X_S/2 - FBP_X_S/2;
const FBP_Y_T = TANK_BL_Y_T - AXLE_Z_S/2;
const FBP_Z_T = TANK_BL_Z_T;

//for rotations
const WHEEL_DEFAULT_X_R = 90;
const BACK_BODY_PART_Z_R = 65;//-25;//65;
const FRONT_BODY_PART_Z_R = -65;

const VP_DISTANCE = 10;
const LINE_SIZE = 20;
const AXLES = 4;
const WHEEL_INITIAL_POS_X = 0.2;
var lookAtX = VP_DISTANCE;
var lookAtY = VP_DISTANCE;
var lookAtZ = VP_DISTANCE;
var normalX = 0;
var normalY = 1;
var movingTank = 0.0;
const MOVING_TANK_INC = 0.1;
const WHEEL_ANGLE_INC = 360 * MOVING_TANK_INC / (2 * Math.PI * TORUS_TOTAL_RADIUS* 1.1); //0.7 wheel radius and 1.1 scale 
var wheelAngle = 0;
var tankAngle = 0;
var tankHorizontalAngle = 0;
const TANK_MIN_ANGLE = -13; 
const TANK_MAX_ANGLE = 15; 
var shootBullet = false;
var bullets = [];


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
            case ' ':
                shootBullet = true;
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

    function BoardCube() {
        multScale([BOARD_X_S, BOARD_Y_S, BOARD_Z_S]);
        // Send the current modelview matrix to the vertex shader
        uploadModelView();
            
        // Draw a cube
        CUBE.draw(gl, program, mode);
    }

    function LineBoard(num)
    {   
        for(var i = 0; i < LINE_SIZE; i++){
            if((i%2 == 0 && num%2 == 0) || i%2 != 0 && num%2 != 0)  gl.uniform4fv(ucolor, [1.0,1.0,1.0,1.0]);
            else  gl.uniform4fv(ucolor, [0.3,0.0,0.5,1.0]);
            multTranslation([BOARD_X_S,BOARD_CUBE_Y_T,BOARD_CUBE_Z_T]);
            pushMatrix();
            BoardCube();
            popMatrix();
        }
    }
    function Board()
    {   
        var changeLine = (-LINE_SIZE/2.0) * BOARD_Z_S;
        for(var i = 0; i < LINE_SIZE; i++){
            pushMatrix();
            multTranslation([(-LINE_SIZE/2.0) * BOARD_X_S, -BOARD_Y_S/2, changeLine]);
            LineBoard(i);
            changeLine+=BOARD_Z_S;
            popMatrix();
        }
    }
    function Wheel() {
        multTranslation([WHEEL_X_T, WHEEL_Y_T, WHEEL_Z_T]);
        multRotationZ(wheelAngle);
        multRotationX(WHEEL_DEFAULT_X_R); 
        multScale([WHEEL_X_S, WHEEL_Y_S, WHEEL_Z_S]);

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
        multTranslation([AXLE_X_T, AXLE_Y_T, AXLE_Z_T]);
        multRotationZ(wheelAngle);
        multRotationX(90); 
        multScale([AXLE_X_S, AXLE_Y_S, AXLE_Z_S]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        // Draw the two associated wheels
        //Wheels();
    }

    function WheelsAxles() {
        var z = 2.0;
        var x = WHEEL_INITIAL_POS_X;
        for(var i = 0; i < AXLES; i++){
            pushMatrix();
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
        /*
        pushMatrix();
            TopPart();
        popMatrix();*/
    }

    function BottomPart() {
        pushMatrix();
        WheelsAxles();
        popMatrix();
    }
    
    function BackBodyPart() {
        gl.uniform4fv(ucolor, [0.13,0.20,0.0,1.0]);
        multTranslation([BBP_X_T, BBP_Y_T, BBP_Z_T]);
        multRotationZ(BACK_BODY_PART_Z_R); 
        multScale([BBP_X_S, BBP_Y_S, BBP_Z_S]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }

    function FrontBodyPart() {
        pushMatrix();
        gl.uniform4fv(ucolor, [0.13,0.20,0.0,1.0]);
        multTranslation([FBP_X_T, FBP_Y_T, FBP_Z_T]);
        multRotationZ(FRONT_BODY_PART_Z_R); 
        multScale([FBP_X_S, FBP_Y_S, FBP_Z_S]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function TankBodyLow() {
        //gl.uniform4fv(ucolor, [0.13,0.20,0.0,1.0]);
        gl.uniform4fv(ucolor, [0.13,0.90,0.8,1.0]);
        multTranslation([TANK_BL_X_T, TANK_BL_Y_T, TANK_BL_Z_T]);
        multScale([TANK_BL_X_S, TANK_BL_Y_S, TANK_BL_Z_S]);

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
    function Screw(){
        gl.uniform4fv(ucolor, [0.0,0.0,0.0,1.0]);
        multScale([0.2, 0.2, 0.05]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        SPHERE.draw(gl, program, mode);
    }
    function CircularScrews(){
        pushMatrix();
        multTranslation([4.0, 2.75, 0.8]);
        Screw();
        popMatrix();
        pushMatrix();
        multTranslation([4.0, 2.75, 2.2]);
        Screw();
        popMatrix();
    }

    function InclinedRectangle() {
        gl.uniform4fv(ucolor, [0.10,0.37,0.25,1.0]);
        multTranslation([5.8, 2.66, 1.5]);
        multRotationZ(45); 
        multScale([0.5, 0.5, 1.4]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        CUBE.draw(gl, program, mode);
    }
    function TopRectangle(){
        pushMatrix();
            InclinedSquare();
        popMatrix();
        pushMatrix();
            InclinedRectangle();
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
            CircularScrews();
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

            if(shootBullet){
                pushMatrix();
                multScale([10, 10/4, 2]);
                createBullet();
                multScale([0.1, 0.4, 0.5]);
                popMatrix();
                shootBullet = false;
            }
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
    function createBullet() {
        multScale([0.35, 0.35, 0.35]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a cube
        SPHERE.draw(gl, program, mode);
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
