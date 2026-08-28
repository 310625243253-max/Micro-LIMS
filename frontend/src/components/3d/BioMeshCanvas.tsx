import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BioMeshCanvasProps {
  particleColor?: string;
  helixColorA?: string;
  helixColorB?: string;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}

export const BioMeshCanvas: React.FC<BioMeshCanvasProps> = ({
  particleColor = '#00f0ff',
  helixColorA = '#0284c7',
  helixColorB = '#8b5cf6',
  className,
  style,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 45;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. DNA Double Helix Group
    const dnaGroup = new THREE.Group();
    const strandRadius = 9;
    const heightSpan = 60;
    const steps = isMobile ? 36 : 64;
    const turns = 3.5;

    const strandAGeometry = new THREE.BufferGeometry();
    const strandBGeometry = new THREE.BufferGeometry();
    const strandAPositions: number[] = [];
    const strandBPositions: number[] = [];

    const rungMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });

    const sphereGeo = new THREE.SphereGeometry(0.55, 12, 12);
    const sphereMatA = new THREE.MeshBasicMaterial({ color: new THREE.Color(helixColorA) });
    const sphereMatB = new THREE.MeshBasicMaterial({ color: new THREE.Color(helixColorB) });

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * heightSpan;

      const xA = Math.cos(angle) * strandRadius;
      const zA = Math.sin(angle) * strandRadius;
      strandAPositions.push(xA, y, zA);

      const xB = Math.cos(angle + Math.PI) * strandRadius;
      const zB = Math.sin(angle + Math.PI) * strandRadius;
      strandBPositions.push(xB, y, zB);

      // Spheres at base pairs
      const sphereA = new THREE.Mesh(sphereGeo, sphereMatA);
      sphereA.position.set(xA, y, zA);
      dnaGroup.add(sphereA);

      const sphereB = new THREE.Mesh(sphereGeo, sphereMatB);
      sphereB.position.set(xB, y, zB);
      dnaGroup.add(sphereB);

      // Base pair rungs
      if (i % 2 === 0) {
        const rungGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xA, y, zA),
          new THREE.Vector3(xB, y, zB),
        ]);
        const rungLine = new THREE.Line(rungGeo, rungMaterial);
        dnaGroup.add(rungLine);
      }
    }

    strandAGeometry.setAttribute('position', new THREE.Float32BufferAttribute(strandAPositions, 3));
    strandBGeometry.setAttribute('position', new THREE.Float32BufferAttribute(strandBPositions, 3));

    const lineMatA = new THREE.LineBasicMaterial({ color: new THREE.Color(helixColorA), transparent: true, opacity: 0.8 });
    const lineMatB = new THREE.LineBasicMaterial({ color: new THREE.Color(helixColorB), transparent: true, opacity: 0.8 });

    const lineA = new THREE.Line(strandAGeometry, lineMatA);
    const lineB = new THREE.Line(strandBGeometry, lineMatB);
    dnaGroup.add(lineA);
    dnaGroup.add(lineB);

    dnaGroup.rotation.z = Math.PI / 6;
    dnaGroup.position.set(isMobile ? 0 : 12, 0, -5);
    scene.add(dnaGroup);

    // 4. Background Particle Galaxy / Starfield
    const particleCount = isMobile ? 120 : 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 110;
      particlePositions[i + 1] = (Math.random() - 0.5) * 90;
      particlePositions[i + 2] = (Math.random() - 0.5) * 70;
      particleVelocities.push((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(particleColor),
      size: 1.4,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Mouse Parallax Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // 6. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Render Animation Loop
    let animationFrameId: number;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      // Smooth mouse interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Rotate DNA double-helix
      dnaGroup.rotation.y += 0.008;
      dnaGroup.rotation.x = currentMouseY * 0.35 + 0.2;
      dnaGroup.rotation.z = Math.PI / 6 + currentMouseX * 0.25;

      // Rotate particle network
      particles.rotation.y -= 0.001;
      particles.rotation.x = currentMouseY * 0.15;

      // Animate floating particles
      const posArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += particleVelocities[i * 2 + 1];
        if (posArr[i * 3 + 1] > 45) posArr[i * 3 + 1] = -45;
        if (posArr[i * 3 + 1] < -45) posArr[i * 3 + 1] = 45;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      strandAGeometry.dispose();
      strandBGeometry.dispose();
      particleGeo.dispose();
      sphereGeo.dispose();
      sphereMatA.dispose();
      sphereMatB.dispose();
      rungMaterial.dispose();
      lineMatA.dispose();
      lineMatB.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [particleColor, helixColorA, helixColorB, interactive]);

  return (
    <div
      ref={containerRef}
      className={`bio-3d-canvas-container ${className || ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    />
  );
};
