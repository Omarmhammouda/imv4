"use client";

import { Suspense, Component, useMemo, useEffect, useRef, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import SprayBurst from "./SprayBurst";

const GLB_URL = "/models/spray-can.glb";
const TARGET_HEIGHT = 3.2;
const NOZZLE: [number, number, number] = [0, 1.85, 0];

/* ----------------------------------------------------- GLB-backed can */
function CanModel() {
  const gltf = useGLTF(GLB_URL);
  const setCanReady = useExperience((s) => s.setCanReady);

  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    // normalise: centre + scale to a consistent height
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = TARGET_HEIGHT / (size.y || 1);
    root.scale.setScalar(s);
    root.position.set(-center.x * s, -center.y * s, -center.z * s);

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) {
          mat.envMapIntensity = 1.25;
          mat.needsUpdate = true;
        }
      }
    });
    return root;
  }, [gltf.scene]);

  useEffect(() => {
    setCanReady(true);
  }, [setCanReady]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB_URL);

/* ----------------------------------------------- procedural fallback */
function ProceduralCan() {
  const body = useMemo(() => {
    // lathe profile for body + shoulder dome
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0.0, -1.6));
    pts.push(new THREE.Vector2(0.62, -1.6));
    pts.push(new THREE.Vector2(0.64, -1.5));
    pts.push(new THREE.Vector2(0.64, 0.95));
    pts.push(new THREE.Vector2(0.6, 1.12));
    pts.push(new THREE.Vector2(0.4, 1.32)); // shoulder dome
    pts.push(new THREE.Vector2(0.26, 1.42));
    pts.push(new THREE.Vector2(0.26, 1.5));
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  return (
    <group>
      {/* aluminium body */}
      <mesh geometry={body}>
        <meshStandardMaterial color="#1b1b1e" metalness={1} roughness={0.34} />
      </mesh>
      {/* white label band */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.652, 0.652, 1.5, 64, 1, true]} />
        <meshStandardMaterial color="#f3f1ec" metalness={0} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* red plastic cap */}
      <mesh position={[0, 1.72, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.55, 48]} />
        <meshStandardMaterial color="#ff2233" metalness={0.1} roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.5, 0.42, 0.12, 48]} />
        <meshStandardMaterial color="#e30d22" metalness={0.1} roughness={0.5} />
      </mesh>
      {/* nozzle */}
      <mesh position={[0, 2.12, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.16, 24]} />
        <meshStandardMaterial color="#0e0e10" metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------- error boundary */
class GLBErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — procedural fallback renders */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ----------------------------------------------- public component */
export default function SprayCan() {
  const groupRef = useRef<THREE.Group>(null);
  const setCanReady = useExperience((s) => s.setCanReady);

  // mark ready for the procedural path too
  useEffect(() => {
    const t = setTimeout(() => setCanReady(true), 100);
    return () => clearTimeout(t);
  }, [setCanReady]);

  return (
    <group ref={groupRef}>
      <GLBErrorBoundary fallback={<ProceduralCan />}>
        <Suspense fallback={<ProceduralCan />}>
          <CanModel />
        </Suspense>
      </GLBErrorBoundary>
      <SprayBurst position={NOZZLE} />
    </group>
  );
}
