import { GameObject } from './game-object';

export class Orb extends GameObject {
    constructor(mesh, position, size) {
        super(mesh, position, size);
        this.cooldownDuration = 2;
        this.cooldown = 0;
        this.active = true;
    }

    collect() {
        if (!this.active) return;

        this.active = false;
        this.cooldown = this.cooldownDuration;
        this.mesh.visible = false;
    }

    update(deltatime) {
        if (this.active) return;

        this.cooldown -= deltatime;
        if (this.cooldown <= 0) {
            this.cooldown = 0;
            this.active = true;
            this.mesh.visible = true;
        }
    }
}
