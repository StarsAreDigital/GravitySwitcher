import * as THREE from 'three';
import { AABB, goTowards, pointInBox, Directions } from './common';
import { GameObject } from './game-object';
import { float } from 'three/tsl';

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
        maxFallSpeed = 0.5,
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
        this.lastConsumedJumpInput = null;
        this.canSwitchGravity = true;
    };

    update({ deltatime, downKeys, elapsed, solidBlocks }) {

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

        //#region Jumping and gravity switching
        let desiredJump = false;
        if ("ArrowUp" in downKeys && elapsed - downKeys["ArrowUp"] <= this.maxBufferTime) {
            desiredJump = true;
        }

        if (this.grounded) this.canSwitchGravity = true;
        if (desiredJump && this.lastConsumedJumpInput != downKeys["ArrowUp"]) {
            this.lastConsumedJumpInput = downKeys["ArrowUp"];
            if (this.grounded) {
                if (Math.sign(this.speed.y) == Math.sign(this.gravity)) {
                    this.speed.y = 0;
                }
                this.speed.y += this.jumpSpeed;
            } else if (this.canSwitchGravity) {
                this.canSwitchGravity = false;
                this.gravity = -this.gravity;
                this.maxFallSpeed = -this.maxFallSpeed;
                this.jumpSpeed = -this.jumpSpeed;
            }
        }

        this.speed.y = goTowards(this.speed.y, -this.maxFallSpeed, this.gravity);
        //#endregion

        this.position.x += this.speed.x;
        this.position.y += this.speed.y;

        //#region Colision detection and resolving
        for (const block of solidBlocks) {
            const playerStart = this.position;
            const playerEnd = (new THREE.Vector2).addVectors(this.position, this.size);

            const blockStart = block.position;
            const blockEnd = (new THREE.Vector2).addVectors(block.position, block.size);

            const minkowskiStart = (new THREE.Vector2).subVectors(playerStart, blockEnd);
            const minkowskiEnd = (new THREE.Vector2).subVectors(playerEnd, blockStart);

            const penetration = new THREE.Vector2(0, 0);
            let directionNudged = null;

            if (minkowskiStart.x <= 0 && minkowskiStart.y <= 0 && minkowskiEnd.x >= 0 && minkowskiEnd.y >= 0) {
                let min = Infinity;
                if (Math.abs(minkowskiStart.x) < min) {
                    min = Math.abs(minkowskiStart.x);
                    penetration.x = -minkowskiStart.x;
                    penetration.y = 0;
                    directionNudged = Directions.RIGHT;
                }
                if (Math.abs(minkowskiEnd.x) < min) {
                    min = Math.abs(minkowskiEnd.x);
                    penetration.x = -minkowskiEnd.x;
                    penetration.y = 0;
                    directionNudged = Directions.LEFT;
                }
                if (Math.abs(minkowskiStart.y) < min) {
                    min = Math.abs(minkowskiStart.y);
                    penetration.x = 0;
                    penetration.y = -minkowskiStart.y;
                    directionNudged = Directions.UP;
                }
                if (Math.abs(minkowskiEnd.y) < min) {
                    min = Math.abs(minkowskiEnd.y);
                    penetration.x = 0;
                    penetration.y = -minkowskiEnd.y;
                    directionNudged = Directions.DOWN;
                }
            }

            this.position.add(penetration);
            if (directionNudged) {
                if (directionNudged == Directions.LEFT) {
                    this.speed.x = Math.min(this.speed.x, 0);
                }
                if (directionNudged == Directions.RIGHT) {
                    this.speed.x = Math.max(this.speed.x, 0);
                }
                if (directionNudged == Directions.DOWN) {
                    this.speed.y = Math.min(this.speed.y, 0);
                }
                if (directionNudged == Directions.UP) {
                    this.speed.y = Math.max(this.speed.y, 0);
                }
            }
        }
        //#endregion

        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.scale.x = this.size.x;
        this.mesh.scale.y = this.size.y;
    }
}