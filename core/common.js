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

export function loadScene(path) {
    fs.readFile('')
}