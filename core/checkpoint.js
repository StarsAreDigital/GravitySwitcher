import * as THREE from 'three';
import { GameObject } from './game-object';

export class Checkpoint extends GameObject {

    constructor(mesh, position, size, gravity) {
        super(mesh, position, size);
        this.gravity = gravity;
    };
}