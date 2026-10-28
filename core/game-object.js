import * as THREE from 'three';
import { goTowards, pointInBox } from './common';

export class GameObject {
    constructor(mesh, position, size) {
        this.mesh = mesh;
        this.position = position;
        this.size = size;
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.scale.x = this.size.x;
        this.mesh.scale.y = this.size.y;
    }
};