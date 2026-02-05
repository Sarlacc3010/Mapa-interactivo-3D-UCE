import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import { Vector3, Raycaster } from 'three';

export function FirstPersonController({ active, speed = 30 }) {
  const { camera, scene } = useThree();
  const [, get] = useKeyboardControls();
  const controlsRef = useRef();

  const velocity = useRef(new Vector3(0, 0, 0));
  const raycaster = useRef(new Raycaster());

  const PLAYER_HEIGHT = 1.8;
  const COLLISION_DISTANCE = 3.0;
  const WALK_SPEED = 30;
  const RUN_SPEED = 60;
  const CROUCH_SPEED = 15;

  useEffect(() => {
    if (active && controlsRef.current) {
      controlsRef.current.minPolarAngle = Math.PI / 2 - 0.6;
      controlsRef.current.maxPolarAngle = Math.PI / 2 + 0.6;
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!active) return;
    if (!controlsRef.current?.isLocked) return;

    const { forward, backward, left, right, sprint, crouch } = get();

    // Determine current speed based on input
    let currentSpeed = WALK_SPEED;
    if (sprint) currentSpeed = RUN_SPEED;
    else if (crouch) currentSpeed = CROUCH_SPEED;

    const inputZ = Number(forward) - Number(backward);
    const inputX = Number(right) - Number(left);

    const targetVelocity = new Vector3();
    targetVelocity.set(inputX, 0, inputZ).normalize().multiplyScalar(currentSpeed);

    // Suavizado de movimiento (Inercia)
    velocity.current.lerp(targetVelocity, 15.0 * delta);

    // --- COLISIONES ---
    if (velocity.current.lengthSq() > 0.1) {
      const direction = new Vector3();
      controlsRef.current.getDirection(direction);

      if (inputZ < 0) direction.negate();
      direction.y = 0;
      direction.normalize();

      raycaster.current.set(camera.position, direction);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      const hit = intersects.find(obj =>
        obj.distance < COLLISION_DISTANCE &&
        !obj.object.name.includes('Suelo') &&
        !obj.object.name.includes('Plane') &&
        !obj.object.name.includes('Road') &&
        !obj.object.name.includes('Grass') &&
        obj.point.y > (camera.position.y - 1.0)
      );

      if (hit) velocity.current.set(0, 0, 0);
    }

    if (controlsRef.current) {
      controlsRef.current.moveRight(velocity.current.x * delta);
      controlsRef.current.moveForward(velocity.current.z * delta);
    }

    // Mantener altura fija
    camera.position.y = PLAYER_HEIGHT;
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      makeDefault={active}
      selector="#canvas-container"
    />
  );
}