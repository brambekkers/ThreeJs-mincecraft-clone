import * as THREE from 'three'
import { blocks } from '../constants/blocks.js'

const collisionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.2, visible: false  })
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001)
const contactMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, visible: false })
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6)


export class Physics {
  constructor({ scene, gui }) {
    this.scene = scene

    // Helpers
    this.helpers = new THREE.Group()
    this.scene.add(this.helpers)
    this.gui = gui

    // Physics settings
    this.simulationRate = 200
    this.timeStep = 1 / this.simulationRate
    this.accumulator = 0
    this.gravity = 32

    this.addGui()
  }

  update(deltaTime, player, world) {
    this.accumulator += deltaTime
    while(this.accumulator >= this.timeStep) {
      // run physics
      this.helpers.clear()
      this.updateVelocity(this.timeStep, player)
      player.applyInputs(this.timeStep)
      player.updateBoundsHelper()
      this.detectCollisions(player, world)

      // Update the accumulator
      this.accumulator -= this.timeStep
    }
    
  }

  updateVelocity(deltaTime, player) {
    player.velocity.y -= this.gravity * deltaTime
  }

  detectCollisions(player, world) {
    player.onGround = false
    const candidate = this.broadPhase(player, world)
    const collisions = this.narrowPhase(candidate, player)

    if (collisions.length > 0) {
      this.resolveCollisions(collisions, player)
    }
  }

  broadPhase(player, world) {
    const candidate = []
    const extents = this.playerExtents(player)
    for (let x = extents.x.min; x <= extents.x.max; x++) {
      for (let y = extents.y.min; y <= extents.y.max; y++) {
        for (let z = extents.z.min; z <= extents.z.max; z++) {
          const block = world.getBlock({ x, y, z })
          if (block?.id === blocks.empty.id) continue
          candidate.push({ ...block, x, y, z })
          this.addCollisionHelper({ x, y, z })
        }
      }
    }
    return candidate
  }

  narrowPhase(candidates, player) {
    const collisions = [];
  
    candidates.forEach((block) => {
      // Get the point on the block that is closest to the center of the player's bounding cylinder
      const closestPoint = {
        x: Math.max(block.x - 0.5, Math.min(player.position.x, block.x + 0.5)),
        y: Math.max(block.y - 0.5, Math.min(player.position.y - (player.height / 2), block.y + 0.5)),
        z: Math.max(block.z - 0.5, Math.min(player.position.z, block.z + 0.5))
      };

      // Get distance along each axis between closest point and the center
      // of the player's bounding cylinder
      const dx = closestPoint.x - player.position.x;
      const dy = closestPoint.y - (player.position.y - (player.height / 2));
      const dz = closestPoint.z - player.position.z;

      this.addContactHelper(closestPoint);
      if (!this.isPointInsidePlayer(closestPoint, player)) return;


      // Compute the overlap between the point and the player's bounding
      // cylinder along the y-axis and in the xz-plane
      const overlapY = (player.height / 2) - Math.abs(dy);
      const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);

      // Compute the normal of the collision (pointing away from the contact point)
      // and the overlap between the point and the player's bounding cylinder
      let normal, overlap;
      if (overlapY < overlapXZ) {
        normal = new THREE.Vector3(0, -Math.sign(dy), 0);
        overlap = overlapY;
        player.onGround = true;
      } else {
        normal = new THREE.Vector3(-dx, 0, -dz).normalize();
        overlap = overlapXZ;
      }

      collisions.push({
        block,
        contactPoint: closestPoint,
        normal,
        overlap
      });
    });

    return collisions;
  }

  resolveCollisions(collisions, player) {
    // Sort collisions by overlap, smallest to largest 
    collisions.sort((a, b) => a.overlap < b.overlap)

    // Move the player out of each collision
    collisions.forEach((collision) => {
      // After moving the player, we recheck if the player is inside the block
      // If they are, we skip this collision
      if (!this.isPointInsidePlayer(collision.contactPoint, player)) return

      let deltaPosition = collision.normal.clone().multiplyScalar(collision.overlap)
      player.position.add(deltaPosition)
      

      // Calculate the new velocity
      let magnitude = player.worldVelocity.dot(collision.normal)
      let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude)

      // Apply the velocity adjustment
      player.applyWorldDeltaVelocity(velocityAdjustment.negate())
    })
  }

  playerExtents(player) {
    return {
      x: {
        min: Math.floor(player.position.x - player.radius),
        max: Math.ceil(player.position.x + player.radius)
      },
      y: {
        min: Math.floor(player.position.y - player.height),
        max: Math.ceil(player.position.y + player.height)
      },
      z: {
        min: Math.floor(player.position.z - player.radius),
        max: Math.ceil(player.position.z + player.radius)
      }
    }
  }

  addCollisionHelper(blockPosition) {
    const collisionHelper = new THREE.Mesh(collisionGeometry, collisionMaterial)
    collisionHelper.position.copy(blockPosition)
    this.helpers.add(collisionHelper)
  }

  addContactHelper(contactPoint) {
    const contactHelper = new THREE.Mesh(contactGeometry, contactMaterial)
    contactHelper.position.copy(contactPoint)
    this.helpers.add(contactHelper)
  }

  isPointInsidePlayer(point, player) {
    const dx = point.x - player.position.x
    const dy = point.y - (player.position.y - player.height / 2)
    const dz = point.z - player.position.z
    const r_squared = dx * dx + dz * dz

    return Math.abs(dy) < player.height / 2 && r_squared < player.radius * player.radius
  }

  addGui(){
    const controls = this.gui.addFolder('Physics').close()
    controls.add(this, 'gravity', -this.gravity, this.gravity * 3, 1)

    const guiCollision = controls.addFolder('Collision').close()
    guiCollision.add(collisionMaterial, 'visible').name('Show collision boxes')
    guiCollision.add(contactMaterial, 'visible').name('Show contact Points')
  }
}

export default Physics
