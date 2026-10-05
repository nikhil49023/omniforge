'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { spaceAudio } from '@/lib/space-audio';
import { jevSpaceCoPilot, JevSpaceGuidance } from '@/lib/jev-space';

export interface SpaceFlightStats {
  shields: number;
  hull: number;
  score: number;
  speed: number;
  warpActive: boolean;
  targetsDestroyed: number;
  jevGuidance: JevSpaceGuidance;
  gameOver: boolean;
}

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  isEnemy?: boolean;
}

interface Asteroid {
  mesh: THREE.Mesh;
  radius: number;
  rotationSpeed: THREE.Vector3;
  velocity: THREE.Vector3;
}

interface Drone {
  group: THREE.Group;
  velocity: THREE.Vector3;
  hp: number;
  attackCooldown: number;
}

export function SpaceCanvas({ onStatsUpdate }: { onStatsUpdate?: (stats: SpaceFlightStats) => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    shields: 100,
    hull: 100,
    score: 0,
    targetsDestroyed: 0,
    speed: 40,
    targetSpeed: 40,
    warpActive: false,
    shipRotX: 0,
    shipRotY: 0,
    shipBank: 0,
    gameOver: false,
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      spaceAudio.startThrusterLoop();

      if (e.code === 'Space' || e.code === 'KeyJ') {
        firePlayerLaser();
      }
      if (e.code === 'ShiftLeft' || e.code === 'KeyW') {
        stateRef.current.warpActive = true;
        spaceAudio.playWarp();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'KeyW') {
        stateRef.current.warpActive = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        spaceAudio.startThrusterLoop();
        firePlayerLaser();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Shared laser firing reference for 3D scene
  const fireLaserFnRef = useRef<() => void>(() => {});
  const firePlayerLaser = () => {
    fireLaserFnRef.current();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060e, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      2500
    );
    camera.position.set(0, 4.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Celestial Lighting
    const ambientLight = new THREE.AmbientLight(0x181e36, 1.2);
    scene.add(ambientLight);

    const starSun = new THREE.DirectionalLight(0x7dd3fc, 2.5);
    starSun.position.set(120, 80, -200);
    scene.add(starSun);

    const nebulaRimLight = new THREE.DirectionalLight(0xc084fc, 1.8);
    nebulaRimLight.position.set(-100, -50, 100);
    scene.add(nebulaRimLight);

    // 3. Build Procedural Valkyrie-7 Starfighter
    const shipGroup = new THREE.Group();

    // Fuselage
    const fuselageGeo = new THREE.ConeGeometry(1.6, 7.5, 5);
    fuselageGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    shipGroup.add(fuselage);

    // Cyan Cockpit Canopy
    const canopyGeo = new THREE.SphereGeometry(0.85, 16, 12);
    canopyGeo.scale(0.8, 0.5, 1.8);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.7, 0.5);
    shipGroup.add(canopy);

    // Swept Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(4.8, -2.5);
    wingShape.lineTo(4.2, -4.2);
    wingShape.lineTo(0, -2.8);
    wingShape.closePath();

    const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05 });
    wingExtrude.rotateX(Math.PI / 2);
    const rightWing = new THREE.Mesh(wingExtrude, hullMat);
    rightWing.position.set(0.6, 0.1, 0.5);
    shipGroup.add(rightWing);

    const leftWing = rightWing.clone();
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-0.6, 0.1, 0.5);
    shipGroup.add(leftWing);

    // Twin Ion Thruster Glow Cones
    const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.55, 1.4, 12);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(1.1, 0.2, 3.2);
    shipGroup.add(rightThruster);

    const leftThruster = rightThruster.clone();
    leftThruster.position.set(-1.1, 0.2, 3.2);
    shipGroup.add(leftThruster);

    scene.add(shipGroup);

    // 4. Procedural Relativistic Hyperspace Starfield (3,500 Stars)
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    const starOriginalZ = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 800;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      const z = (Math.random() - 0.5) * 1200 - 300;
      starPositions[i * 3 + 2] = z;
      starOriginalZ[i] = z;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 1.8,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Volumetric Cosmic Nebula Cloud Spheres
    const nebulaGroup = new THREE.Group();
    const nebulaColors = [0x4338ca, 0x6d28d9, 0x0284c7, 0x831843];
    for (let i = 0; i < 24; i++) {
      const nGeo = new THREE.DodecahedronGeometry(Math.random() * 80 + 50, 1);
      const nMat = new THREE.MeshBasicMaterial({
        color: nebulaColors[i % nebulaColors.length],
        transparent: true,
        opacity: 0.05,
        wireframe: true,
      });
      const nebulaMesh = new THREE.Mesh(nGeo, nMat);
      nebulaMesh.position.set(
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 600,
        -Math.random() * 800 - 200
      );
      nebulaGroup.add(nebulaMesh);
    }
    scene.add(nebulaGroup);

    // 6. Procedural Asteroids Swarm
    const asteroids: Asteroid[] = [];
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
    });

    for (let i = 0; i < 45; i++) {
      const radius = Math.random() * 4 + 2.5;
      const aGeo = new THREE.DodecahedronGeometry(radius, 1);
      // Randomize vertices for authentic space rock deformation
      const posAttr = aGeo.attributes.position!;
      for (let j = 0; j < posAttr.count; j++) {
        const vx = posAttr.getX(j) * (1 + (Math.random() - 0.5) * 0.35);
        const vy = posAttr.getY(j) * (1 + (Math.random() - 0.5) * 0.35);
        const vz = posAttr.getZ(j) * (1 + (Math.random() - 0.5) * 0.35);
        posAttr.setXYZ(j, vx, vy, vz);
      }
      aGeo.computeVertexNormals();

      const aMesh = new THREE.Mesh(aGeo, asteroidMat);
      aMesh.position.set(
        (Math.random() - 0.5) * 260,
        (Math.random() - 0.5) * 160,
        -Math.random() * 700 - 80
      );
      scene.add(aMesh);

      asteroids.push({
        mesh: aMesh,
        radius,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        velocity: new THREE.Vector3(0, 0, Math.random() * 1.5 + 0.5),
      });
    }

    // 7. Hostile Alien Drone Interceptors
    const drones: Drone[] = [];
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0xe11d48,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (let i = 0; i < 6; i++) {
      const dGroup = new THREE.Group();
      const dBody = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), droneMat);
      dGroup.add(dBody);

      const dRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.15, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
      );
      dRing.rotateX(Math.PI / 2);
      dGroup.add(dRing);

      dGroup.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100,
        -Math.random() * 500 - 150
      );
      scene.add(dGroup);

      drones.push({
        group: dGroup,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 1.2),
        hp: 40,
        attackCooldown: Math.random() * 60 + 30,
      });
    }

    // 8. Projectiles Array & Laser Launcher
    const projectiles: Projectile[] = [];
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6);
    laserGeo.rotateX(Math.PI / 2);
    const playerLaserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    fireLaserFnRef.current = () => {
      const s = stateRef.current;
      if (s.gameOver) return;

      spaceAudio.playLaser();

      // Dual cannons at wingtips
      [-2.4, 2.4].forEach((offset) => {
        const mesh = new THREE.Mesh(laserGeo, playerLaserMat);
        mesh.position.copy(shipGroup.position);
        mesh.position.x += offset;
        mesh.position.y -= 0.1;
        mesh.position.z -= 2.0;

        scene.add(mesh);
        projectiles.push({
          mesh,
          velocity: new THREE.Vector3(0, 0, -260),
          life: 90,
          isEnemy: false,
        });
      });
    };

    // 9. Particle Explosion Sparks Pool
    const explosionParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    const sparkGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    const spawnExplosion = (pos: THREE.Vector3, color = 0xfbbf24) => {
      spaceAudio.playExplosion();
      for (let i = 0; i < 22; i++) {
        const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color }));
        mesh.position.copy(pos);
        scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 5;
        explosionParticles.push({
          mesh,
          vel: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            (Math.random() - 0.5) * speed
          ),
          life: 40,
        });
      }
    };

    // 10. Main 60FPS Three.js Animation Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      const s = stateRef.current;

      // Warp Factor Speed Modulation
      const maxSpeed = s.warpActive ? 180 : 55;
      s.speed = THREE.MathUtils.lerp(s.speed, maxSpeed, 0.08);
      spaceAudio.updateThrusterPitch(s.speed / 180);

      // Camera FOV Warp Stretch Effect
      const targetFOV = s.warpActive ? 85 : 65;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.08);
      camera.updateProjectionMatrix();

      // Ship Steering & Flight Dynamics
      const targetRotX = mouseRef.current.y * 0.45;
      const targetRotY = -mouseRef.current.x * 0.65;
      const targetBank = -mouseRef.current.x * 0.85;

      s.shipRotX = THREE.MathUtils.lerp(s.shipRotX, targetRotX, 0.1);
      s.shipRotY = THREE.MathUtils.lerp(s.shipRotY, targetRotY, 0.1);
      s.shipBank = THREE.MathUtils.lerp(s.shipBank, targetBank, 0.1);

      shipGroup.rotation.x = s.shipRotX;
      shipGroup.rotation.y = s.shipRotY;
      shipGroup.rotation.z = s.shipBank;

      // Position Ship with Lateral Slip
      shipGroup.position.x = THREE.MathUtils.lerp(shipGroup.position.x, mouseRef.current.x * 24, 0.08);
      shipGroup.position.y = THREE.MathUtils.lerp(shipGroup.position.y, mouseRef.current.y * 14, 0.08);

      // Smooth Camera Chase Rig
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, shipGroup.position.x * 0.6, 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, shipGroup.position.y * 0.6 + 4.5, 0.06);

      // Thruster Color Shift on Warp
      thrusterMat.color.setHex(s.warpActive ? 0xf43f5e : 0x06b6d4);

      // Update Starfield (Streaks on Warp)
      const positions = starGeo.attributes.position!.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        let z = positions[i * 3 + 2]! + s.speed * delta * 2.8;
        if (z > 50) {
          z = -1000 - Math.random() * 200;
        }
        positions[i * 3 + 2] = z;
      }
      starGeo.attributes.position!.needsUpdate = true;

      // Update Asteroids
      let nearestAst: { x: number; y: number; z: number; radius: number; distance: number } | null = null;
      let minAstDist = 99999;

      for (const ast of asteroids) {
        ast.mesh.rotation.x += ast.rotationSpeed.x;
        ast.mesh.rotation.y += ast.rotationSpeed.y;
        ast.mesh.position.z += (s.speed * 0.65 + ast.velocity.z) * delta * 4;

        if (ast.mesh.position.z > 30) {
          ast.mesh.position.z = -800 - Math.random() * 200;
          ast.mesh.position.x = (Math.random() - 0.5) * 260;
          ast.mesh.position.y = (Math.random() - 0.5) * 160;
        }

        const distToShip = ast.mesh.position.distanceTo(shipGroup.position);
        if (distToShip < minAstDist) {
          minAstDist = distToShip;
          nearestAst = {
            x: ast.mesh.position.x,
            y: ast.mesh.position.y,
            z: ast.mesh.position.z,
            radius: ast.radius,
            distance: distToShip,
          };
        }

        // Collision: Ship hits Asteroid
        if (distToShip < ast.radius + 1.8 && !s.gameOver) {
          spawnExplosion(shipGroup.position, 0xef4444);
          s.shields -= 25;
          if (s.shields <= 0) {
            s.hull -= 35;
            if (s.hull <= 0) s.gameOver = true;
          }
          ast.mesh.position.z = -900;
        }
      }

      // Update Drones
      let nearestDrone: { x: number; y: number; z: number; vx: number; vy: number; vz: number; distance: number } | null = null;
      let minDroneDist = 99999;

      for (const drone of drones) {
        drone.group.position.z += (s.speed * 0.45 + drone.velocity.z) * delta * 3.5;
        drone.group.rotation.y += 0.02;

        if (drone.group.position.z > 30) {
          drone.group.position.z = -700 - Math.random() * 200;
          drone.group.position.x = (Math.random() - 0.5) * 200;
          drone.group.position.y = (Math.random() - 0.5) * 100;
          drone.hp = 40;
        }

        const distToShip = drone.group.position.distanceTo(shipGroup.position);
        if (distToShip < minDroneDist) {
          minDroneDist = distToShip;
          nearestDrone = {
            x: drone.group.position.x,
            y: drone.group.position.y,
            z: drone.group.position.z,
            vx: drone.velocity.x,
            vy: drone.velocity.y,
            vz: drone.velocity.z,
            distance: distToShip,
          };
        }

        // Drone Attacks
        drone.attackCooldown -= delta * 60;
        if (drone.attackCooldown <= 0 && distToShip < 350 && !s.gameOver) {
          drone.attackCooldown = Math.random() * 80 + 50;
          spaceAudio.playLaser(true);

          const eMesh = new THREE.Mesh(laserGeo, enemyLaserMat);
          eMesh.position.copy(drone.group.position);
          scene.add(eMesh);

          const aimDir = new THREE.Vector3()
            .subVectors(shipGroup.position, drone.group.position)
            .normalize()
            .multiplyScalar(160);

          projectiles.push({
            mesh: eMesh,
            velocity: aimDir,
            life: 80,
            isEnemy: true,
          });
        }
      }

      // Update Projectiles & Hit Detection
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i]!;
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.life -= 1;

        if (p.life <= 0) {
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
          continue;
        }

        // Player laser hits asteroid
        if (!p.isEnemy) {
          for (const ast of asteroids) {
            if (p.mesh.position.distanceTo(ast.mesh.position) < ast.radius + 1.2) {
              spawnExplosion(ast.mesh.position, 0xf59e0b);
              s.score += 150;
              ast.mesh.position.z = -900;
              scene.remove(p.mesh);
              projectiles.splice(i, 1);
              break;
            }
          }

          // Player laser hits drone
          for (const drone of drones) {
            if (p.mesh.position.distanceTo(drone.group.position) < 3.2) {
              drone.hp -= 25;
              spawnExplosion(p.mesh.position, 0x38bdf8);
              scene.remove(p.mesh);
              projectiles.splice(i, 1);

              if (drone.hp <= 0) {
                spawnExplosion(drone.group.position, 0xf43f5e);
                s.score += 500;
                s.targetsDestroyed += 1;
                drone.group.position.z = -800;
              }
              break;
            }
          }
        } else {
          // Enemy laser hits player ship
          if (p.mesh.position.distanceTo(shipGroup.position) < 3.0 && !s.gameOver) {
            spawnExplosion(shipGroup.position, 0xf43f5e);
            s.shields -= 15;
            if (s.shields <= 0) {
              s.hull -= 20;
              if (s.hull <= 0) s.gameOver = true;
            }
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
          }
        }
      }

      // Update Explosion Particles
      for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const ep = explosionParticles[i]!;
        ep.mesh.position.addScaledVector(ep.vel, delta);
        ep.mesh.scale.multiplyScalar(0.95);
        ep.life -= 1;

        if (ep.life <= 0) {
          scene.remove(ep.mesh);
          explosionParticles.splice(i, 1);
        }
      }

      // 11. Evaluate JEV System 1 Tactical Telemetry
      const jevGuidance = jevSpaceCoPilot.evaluate({
        playerPos: { x: shipGroup.position.x, y: shipGroup.position.y, z: shipGroup.position.z },
        playerVelocity: { x: (mouseRef.current.x * 24 - shipGroup.position.x) * 10, y: 0, z: -s.speed },
        nearestTarget: nearestDrone,
        nearestAsteroid: nearestAst,
        warpActive: s.warpActive,
        shields: s.shields,
      });

      // Shield Regeneration in deep space
      if (s.shields < 100 && !s.gameOver) {
        s.shields += delta * 3;
      }

      // Push stats to UI HUD
      if (onStatsUpdate) {
        onStatsUpdate({
          shields: Math.max(0, s.shields),
          hull: Math.max(0, s.hull),
          score: s.score,
          speed: Math.round(s.speed * 28),
          warpActive: s.warpActive,
          targetsDestroyed: s.targetsDestroyed,
          jevGuidance,
          gameOver: s.gameOver,
        });
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onStatsUpdate]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[680px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#04060e] shadow-2xl shadow-cyan-950/40 cursor-crosshair"
    />
  );
}
