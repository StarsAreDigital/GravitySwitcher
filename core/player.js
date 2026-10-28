import * as THREE from 'three';
import { goTowards, pointInBox } from './utils';
import { GameObject } from './game-object';

export class Player extends GameObject {

    constructor(
        mesh,
        position,
        size,
        horizontalAcceleration = 2,
        horizontalDeceleration = 2,
        maxSpeed = 0.3,
        jumpHeight = 5,
        jumpTime = 8,
        maxFallSpeed = 1,
        instantTurnaround = true,
        maxBufferTime = 0.2,
    ) {
        super(mesh, position, size);

        this.horizontalAcceleration = horizontalAcceleration;
        this.horizontalDeceleration = horizontalDeceleration;
        this.maxSpeed = maxSpeed;
        this.maxFallSpeed = maxFallSpeed;
        this.instantTurnaround = instantTurnaround;
        this.maxBufferTime = maxBufferTime;

        this.jumpHeight = jumpHeight;
        this.jumpTime = jumpTime;
        this.gravity = -this.jumpHeight / (2 * Math.pow(this.jumpTime, 2));
        this.jumpSpeed = Math.sqrt(2 * this.jumpHeight * Math.abs(this.gravity));

        this.speed = new THREE.Vector2(0, 0);
        this.grounded = true;
        this.coyoteTimer = 0;
        this.gravityDirection = -1;
    };

    update({ deltatime, downKeys, elapsed }) {

        //#region Horizontal movement
        let targetSpeed = 0;
        let maxSpeedChange = 0;
        if (!("ArrowRight" in downKeys) ^ "ArrowLeft" in downKeys) {
            targetSpeed = 0;
            maxSpeedChange = this.horizontalDeceleration * deltatime;
        } else if ("ArrowRight" in downKeys) {
            if (this.instantTurnaround && this.speed.x < 0) this.speed.x = 0;
            targetSpeed = this.maxSpeed;
            maxSpeedChange = this.horizontalAcceleration * deltatime;
        } else if ("ArrowLeft" in downKeys) {
            if (this.instantTurnaround && this.speed.x > 0) this.speed.x = 0;
            targetSpeed = -this.maxSpeed;
            maxSpeedChange = this.horizontalAcceleration * deltatime;
        }
        this.speed.x = goTowards(this.speed.x, targetSpeed, maxSpeedChange);
        //#endregion

        let desiredJump = false;
        if ("ArrowUp" in downKeys && elapsed - downKeys["ArrowUp"] <= this.maxBufferTime) {
            desiredJump = true;
        }

        if (desiredJump && this.grounded) {
            this.speed.y = this.jumpSpeed;
        }

        this.speed.y = goTowards(this.speed.y, -this.maxFallSpeed, this.gravity);

        this.position.x += this.speed.x;
        this.position.y += this.speed.y;

        if (this.position.y < 0) {
            this.position.y = 0;
            this.speed.y = 0;
        }

        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.scale.x = this.size.x;
        this.mesh.scale.y = this.size.y;
    }
}