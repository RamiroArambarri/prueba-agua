attribute vec4 a_position;
varying vec2 pos;
uniform float aspRatio;

void main() {
    gl_Position = a_position;
    //pos = vec2(a_position.x * aspRatio, a_position.y);
    pos = vec2(a_position.x, a_position.y);
    
}