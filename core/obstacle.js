import * as THREE from 'three';
import { GameObject } from './game-object';

export class Obstacle extends GameObject {

    constructor(mesh, position, size) {
        super(mesh, position, size);
    };
}