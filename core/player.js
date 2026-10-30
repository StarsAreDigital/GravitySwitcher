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
        instantTurnaround = true,
        maxSpeed = 0.3,

        maxBufferTime = 0.2,
        jumpHeight = 5.0,
        jumpTime = 8.0,
        maxFallSpeed = -0.5,
        coyoteTime = 0.1,

        deathTime = 1.0,
        spawnPoint = null,
        spawnGravityDir = -1,
    ) {
        super(mesh, position, size);

        this.horizontalAcceleration = horizontalAcceleration;
        this.horizontalDeceleration = horizontalDeceleration;
        this.maxSpeed = maxSpeed;
        this.instantTurnaround = instantTurnaround;
        this.maxBufferTime = maxBufferTime;

        this.jumpHeight = Math.abs(jumpHeight);
        this.jumpTime = jumpTime;
        this.spawnGravity = spawnGravityDir;
        this.gravity = spawnGravityDir * this.jumpHeight / (2 * Math.pow(this.jumpTime, 2));
        this.jumpSpeed = -spawnGravityDir * Math.sqrt(2 * this.jumpHeight * Math.abs(this.gravity));
        this.maxFallSpeed = maxFallSpeed;
        this.coyoteTime = coyoteTime;

        this.deathTime = deathTime;
        this.spawnPoint = spawnPoint ?? new THREE.Vector2(position.x, position.y);

        this.speed = new THREE.Vector2(0, 0);
        this.grounded = true;
        this.coyoteTimer = 0;
        this.lastConsumedJumpInput = null;
        this.canSwitchGravity = true;
        this.live = true;
    };

    kill() {
        this.deathTimer = this.deathTime;
        this.live = false;
    }

    respawn() {
        this.deathTimer = 0;
        this.live = false;
    }

    update({ deltatime, downKeys, elapsed, solidBlocks = [], hazards = [] }) {
        if (!this.live) {
            this.deathTimer = goTowards(this.deathTimer, 0, deltatime);
            if (this.deathTimer == 0) {
                this.live = true;
                this.position.x = this.spawnPoint.x;
                this.position.y = this.spawnPoint.y;
                this.speed.multiplyScalar(0);
                this.gravity = this.spawnGravity * Math.abs(this.gravity);
                this.jumpSpeed = -this.spawnGravity * Math.abs(this.jumpSpeed);
                this.maxFallSpeed = this.spawnGravity * Math.abs(this.maxFallSpeed);
            }
            return;
        }

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

        if (this.grounded) {
            this.canSwitchGravity = true;
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer = goTowards(this.coyoteTimer, 0, deltatime);
        }
        if (desiredJump && this.lastConsumedJumpInput != downKeys["ArrowUp"]) {
            this.lastConsumedJumpInput = downKeys["ArrowUp"];
            if (this.grounded || this.coyoteTimer > 0) {
                this.coyoteTimer = 0;
                if (Math.sign(this.speed.y) == Math.sign(this.gravity)) {
                    this.speed.y = 0;
                }
                this.speed.y += this.jumpSpeed;
            } else {
                if (this.canSwitchGravity) {
                    this.canSwitchGravity = false;
                    this.gravity = -this.gravity;
                    this.maxFallSpeed = -this.maxFallSpeed;
                    this.jumpSpeed = -this.jumpSpeed;
                }
            }
        }

        this.speed.y = goTowards(this.speed.y, this.maxFallSpeed, this.gravity);
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

        //#region Hazards
        for (const hazard of hazards) {
            const playerStart = this.position;
            const playerEnd = (new THREE.Vector2).addVectors(this.position, this.size);

            const hazardStart = hazard.position;
            const hazardEnd = (new THREE.Vector2).addVectors(hazard.position, hazard.size);

            const minkowskiStart = (new THREE.Vector2).subVectors(playerStart, hazardEnd);
            const minkowskiEnd = (new THREE.Vector2).subVectors(playerEnd, hazardStart);

            if (minkowskiStart.x <= 0 && minkowskiStart.y <= 0 && minkowskiEnd.x >= 0 && minkowskiEnd.y >= 0) {
                this.kill();
            }
        }
        //#endregion

        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.scale.x = this.size.x;
        this.mesh.scale.y = this.size.y;
    }
}