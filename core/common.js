import * as THREE from 'three';
import fs from 'fs';

export const Directions = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
}

export function AABB(a, b) {
    return !(
        a.position.x > b.position.x + b.size.x
        || b.position.x > a.position.x + a.size.x
        || a.position.y > b.position.y + b.size.y
        || b.position.y > a.position.y + a.size.y
    );
}

export function pointInBox(point, box) {
    return point.x >= box.position.x && point.x <= box.position.x + box.size.x
        && point.y >= box.position.y && point.y <= box.position.y + box.size.y;
}

export function goTowards(num, target, delta) {
    if (num > target) {
        num -= Math.abs(delta);
        if (num < target) {
            num = target;
        }
    } else if (num < target) {
        num += Math.abs(delta);
        if (num > target) {
            num = target;
        }
    } else {
        num = target;
    }
    return num;
}

const CAMERA_LOOKAHEAD = false;
const CAMERA_LOOKAHEAD_RATE = 2.0;
const CAMERA_MAX_SPEED = 0.2;
const CAMERA_MAX_DIST = 3.0;
const CAMERA_DAMP_VERTICAL = true;
export function cameraFollow(camera, entity) {
    const target = new THREE.Vector2(entity.position.x, entity.position.y);

    if (CAMERA_LOOKAHEAD && entity.speed) {
        target.addScaledVector(entity.speed, CAMERA_LOOKAHEAD_RATE)
    }

    camera.position.x = goTowards(camera.position.x, target.x, CAMERA_MAX_SPEED);
    if (!CAMERA_DAMP_VERTICAL) {
        camera.position.y = goTowards(camera.position.y, target.y, CAMERA_MAX_SPEED);
    }

    const cameraPosition2d = new THREE.Vector2(camera.position.x, camera.position.y);

    const distToTarget = cameraPosition2d.distanceTo(target);
    if ((distToTarget) > CAMERA_MAX_DIST) {
        cameraPosition2d.lerp(target, (distToTarget - CAMERA_MAX_DIST) / distToTarget);
        camera.position.x = cameraPosition2d.x;
        camera.position.y = cameraPosition2d.y;
    }
}

export function loadScene(path) {
    fs.readFile('')
}