uniform mat4 mModelView;
uniform mat4 mProjection;

attribute vec4 vPosition;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
}