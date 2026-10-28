import * as THREE from 'three';
import { GUI } from 'lil-gui'
import { Player } from './core/player';
import { Obstacle } from './core/obstacle';
import { Solid } from './core/solid';
import { pointInBox } from './core/utils';

let downKeys = {};
const timer = new THREE.Timer();

window.addEventListener('keydown', function (event) {
    if (event.key in downKeys) return;
    downKeys[event.key] = timer.getElapsed();
});

window.addEventListener('keyup', function (event) {
    delete downKeys[event.key];
});

window.addEventListener('blur', function (event) {
    downKeys = {};
});

function animate(time) {
    timer.update(time);
    const deltatime = timer.getDelta();
    const elapsed = timer.getElapsed();

    player.grounded = false;
    const colliderLeft = new THREE.Vector2(
        player.position.x * player.size.x,
        player.position.y + 0.5 + player.gravityDirection * 0.5,
    );
    const colliderRight = new THREE.Vector2(
        player.position.x + player.size.x,
        player.position.y + 0.5 + player.gravityDirection * 0.5,
    );
    for (let block of solidBlocks) {
        if (pointInBox(colliderLeft, block) || pointInBox(colliderRight, block)) {
            player.grounded = true;
        }
    }
    player.update({ deltatime, downKeys, elapsed })


    renderer.render(scene, camera);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setAnimationLoop(animate);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
cubeGeometry.translate(0.5, 0.5, 0.5);
const spikeGeometry = new THREE.ConeGeometry(0.5, 1);
spikeGeometry.translate(0.5, 0.5, 0.5);
const basicMaterial = new THREE.MeshBasicMaterial();
const spikeMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0, 0),
});
const groundMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.5, 0.5, 0.5),
})

const player = new Player(
    new THREE.Mesh(cubeGeometry, basicMaterial),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 1),
);

const spike = new Obstacle(
    new THREE.Mesh(spikeGeometry, spikeMaterial),
    new THREE.Vector2(5, 0),
    new THREE.Vector2(1, 1),
);
spike.mesh.position.x = spike.position.x;
spike.mesh.position.y = spike.position.y;
const hazards = [spike];

const ground = new Solid(
    new THREE.Mesh(cubeGeometry, groundMaterial),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(10000, 1)
);
const solidBlocks = [ground];

const gameElements = [player, ...hazards, ...solidBlocks];
scene.add(...gameElements.map(x => x.mesh));

camera.position.y = 10;
camera.position.z = 20;

const gui = new GUI();
gui.add(player.position, 'x').listen();
gui.add(player, 'grounded').listen().disable();