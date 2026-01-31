precision highp float;
precision highp int;

varying vec2 pos;

uniform vec2 mouse;
uniform sampler2D uTex;

void main() {

    vec4 newCol = vec4(1., length(pos - mouse / 1920.), 0., 1.);
   // vec4 tex = texture2D(uTex, vec2(pos));

    gl_FragColor = vec4(newCol.xyz , 1.);
}
