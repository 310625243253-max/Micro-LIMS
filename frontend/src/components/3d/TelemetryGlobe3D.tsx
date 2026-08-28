import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TelemetryGlobe3DProps {
  size?: number;
  specimensCount?: number;
  culturesCount?: number;
  className?: string;
}

export const TelemetryGlobe3D: React.FC<TelemetryGlobe3DProps> = ({
  size = 140,
  specimensCount = 12,
  culturesCount = 8,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 2. Outer Holographic Wireframe Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(2.1, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, wireMat);
    scene.add(sphereMesh);

    // 3. Inner Glowing Core
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerCore);

    // 4. Orbital Ring
    const ringGeo = new THREE.RingGeometry(2.4, 2.48, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    scene.add(orbitalRing);

    // 5. Specimen Telemetry Nodes (Pulsing glowing spheres)
    const nodeCount = Math.min(24, Math.max(8, specimensCount + culturesCount));
    const nodesGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const nodeMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const nodeMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const nodeMatPurple = new THREE.MeshBasicMaterial({ color: 0xc084fc });

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const r = 2.1;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      const mat = i % 3 === 0 ? nodeMatEmerald : i % 3 === 1 ? nodeMatCyan : nodeMatPurple;
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set(x, y, z);
      nodesGroup.add(node);
    }
    scene.add(nodesGroup);

    // 6. Animation Loop
    let animationId: number;
    let isVisible = true;

    const onVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return;

      sphereMesh.rotation.y += 0.007;
      sphereMesh.rotation.x += 0.003;

      innerCore.rotation.y -= 0.012;
      innerCore.rotation.z += 0.005;

      orbitalRing.rotation.z += 0.008;
      nodesGroup.rotation.y += 0.007;
      nodesGroup.rotation.x += 0.003;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', onVisibility);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      wireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      nodeMatCyan.dispose();
      nodeMatEmerald.dispose();
      nodeMatPurple.dispose();
      renderer.dispose();
    };
  }, [size, specimensCount, culturesCount]);

  return (
    <div
      ref={mountRef}
      className={`telemetry-globe-3d ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    />
  );
};
