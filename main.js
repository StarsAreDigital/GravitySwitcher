import * as THREE from 'three';
import { GUI } from 'lil-gui'
import { Player } from './core/player';
import { Obstacle } from './core/obstacle';
import { Orb } from './core/orb';
import { Solid } from './core/solid';
import { cameraFollow, pointInBox } from './core/common';
import level1 from './core/levels/level-1.json';

let downKeys = {};
let running = true;
const timer = new THREE.Timer();

window.addEventListener('keydown', function (event) {
    if (event.key in downKeys) return;
    downKeys[event.key] = timer.getElapsed();

    if (event.key == 'Escape') {
        running = !running;
    }
});

window.addEventListener('keyup', function (event) {
    delete downKeys[event.key];
});

window.addEventListener('blur', function (event) {
    downKeys = {};
});

function animate(time) {
    if (!running) return;
    timer.update(time);
    const deltatime = timer.getDelta();
    const elapsed = timer.getElapsed();

    player.grounded = false;
    const colliderLeft = new THREE.Vector2(
        player.position.x * player.size.x,
        player.position.y + 0.5 + Math.sign(player.gravity) * 0.5,
    );
    const colliderLeftNudge = new THREE.Vector2(
        colliderLeft.x + 0.001,
        colliderLeft.y
    );
    const colliderRight = new THREE.Vector2(
        player.position.x + player.size.x,
        player.position.y + 0.5 + Math.sign(player.gravity) * 0.5,
    );
    const colliderRightNudge = new THREE.Vector2(
        colliderRight.x - 0.001,
        colliderRight.y
    );
    let leftCollides = false;
    let leftNudgeCollides = false;
    let rightCollides = false;
    let rightNudgeCollides = false;

    for (const block of solidBlocks) {
        leftCollides = leftCollides || pointInBox(colliderLeft, block);
        leftNudgeCollides = leftNudgeCollides || pointInBox(colliderLeftNudge, block);
        rightCollides = rightCollides || pointInBox(colliderRight, block);
        rightNudgeCollides = rightNudgeCollides || pointInBox(colliderRightNudge, block);
    }
    player.grounded = (leftCollides && leftNudgeCollides) || (rightCollides && rightNudgeCollides);
    
    player.update({ deltatime, downKeys, elapsed, solidBlocks, hazards: spikes });

    cameraFollow(camera, player);

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

const orbGeometry = new THREE.CircleGeometry(0.5, 8);
const orbMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0, 1, 0),
});

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

const spikes = level1.spikes.map(spike => {
    const obstacle = new Obstacle(
        new THREE.Mesh(spikeGeometry, spikeMaterial),
        new THREE.Vector2(spike.x, spike.y),
        new THREE.Vector2(spike.width, spike.height),
    );
    const rotation = THREE.MathUtils.degToRad(spike.rotation ?? 0);
    const centerOffset = new THREE.Vector2(spike.width / 2, spike.height / 2)
        .rotateAround(new THREE.Vector2(), rotation);

    obstacle.mesh.rotation.z = rotation;
    obstacle.mesh.position.set(
        spike.x + spike.width / 2 - centerOffset.x,
        spike.y + spike.height / 2 - centerOffset.y,
        obstacle.mesh.position.z,
    );
    return obstacle;
});

const solidBlocks = level1.platforms.map(platform =>
    new Solid(
        new THREE.Mesh(cubeGeometry, groundMaterial),
        new THREE.Vector2(platform.x, platform.y),
        new THREE.Vector2(platform.width, platform.height),
    )
);

const orbs = level1.orbs.map(orb =>
    new Orb(
        new THREE.Mesh(orbGeometry, orbMaterial),
        new THREE.Vector2(orb.x, orb.y),
        new THREE.Vector2(orb.width, orb.height)
    )
);

const gameElements = [player, ...spikes, ...solidBlocks, ...orbs];
scene.add(...gameElements.map(x => x.mesh));

camera.position.y = 10;
camera.position.z = 20;

const gui = new GUI();
const playerFolder = gui.addFolder('Player');
playerFolder.add(player.position, 'x').listen();
playerFolder.add(player.position, 'y').listen();
playerFolder.add(player.speed, 'x').listen();
playerFolder.add(player.speed, 'y').listen();
playerFolder.add(player, 'grounded').listen().disable();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'x').listen();
cameraFolder.add(camera.position, 'y').listen();
cameraFolder.add(camera.position, 'z').listen();
