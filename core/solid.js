import * as THREE from 'three';
import { GameObject } from './game-object';

export class Solid extends GameObject {

    constructor(mesh, position, size) {
        super(mesh, position, size);
    };
}