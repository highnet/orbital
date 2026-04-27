"use client";

import { useMemo, useRef } from "react";

import { Line, OrbitControls, Stars, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { BackSide, Color, SRGBColorSpace } from "three";

import {
    hasRenderableOrbit,
    propagateTrackPosition,
    sampleTrackOrbit,
    trackPositionToVector3,
    type TrackSnapshot,
} from "@/lib/orbital";

type GlobeCanvasProps = {
  currentTime: Date;
  tracks: TrackSnapshot[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
};

type RenderableTrack = {
  track: TrackSnapshot;
  color: string;
};

function SelectedOrbit({
  currentTime,
  track,
}: {
  currentTime: Date;
  track: TrackSnapshot | null;
}) {
  const points = useMemo(() => {
    if (!track) {
      return [];
    }

    return sampleTrackOrbit(track, currentTime);
  }, [currentTime, track]);

  if (points.length < 2) {
    return null;
  }

  return (
    <Line
      points={points}
      color="#7dd3fc"
      lineWidth={1.2}
      transparent
      opacity={0.55}
      depthTest={false}
    />
  );
}

function Earth() {
  const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/textures/earth-day.jpg",
    "/textures/earth-normal.jpg",
    "/textures/earth-specular.jpg",
    "/textures/earth-clouds.png",
  ]);

  dayMap.colorSpace = SRGBColorSpace;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={18}
          specular={new Color("#9dd8ff")}
        />
      </mesh>
      <mesh scale={1.008}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.07}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          color="#67d6ff"
          transparent
          opacity={0.1}
          side={BackSide}
        />
      </mesh>
    </group>
  );
}

function SatelliteMarkers({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: GlobeCanvasProps) {
  const markerGroup = useRef<Group>(null);

  const renderableTracks = useMemo<RenderableTrack[]>(() => {
    return tracks
      .filter((track) => track.objectType === "SATELLITE" && hasRenderableOrbit(track))
      .map((track, index) => ({
        track,
        color: ["#7dd3fc", "#f9a8d4", "#c4b5fd", "#86efac", "#fcd34d"][
          index % 5
        ],
      }));
  }, [tracks]);

  useFrame(() => {
    const simulatedNow = new Date();

    markerGroup.current?.children.forEach((child, index) => {
      const renderableTrack = renderableTracks[index];

      if (!renderableTrack) {
        child.visible = false;
        return;
      }

      const propagatedPosition = propagateTrackPosition(
        renderableTrack.track,
        simulatedNow,
      );

      if (!propagatedPosition) {
        child.visible = false;
        return;
      }

      child.visible = true;
      child.position.copy(trackPositionToVector3(propagatedPosition));
    });
  });

  return (
    <group ref={markerGroup}>
      {renderableTracks.map(({ track, color }) => {
        const isSelected = track.objectId === selectedTrackId;

        return (
          <mesh
            key={track.objectId}
            onClick={(event) => {
              event.stopPropagation();
              onSelectTrack(track.objectId);
            }}
            scale={isSelected ? 1.45 : 1}
          >
            <sphereGeometry args={[0.015, 18, 18]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isSelected ? 1.2 : 0.82}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function GlobeCanvas(props: GlobeCanvasProps) {
  const selectedTrack = useMemo(() => {
    return (
      props.tracks.find(
        (track) => track.objectId === props.selectedTrackId && hasRenderableOrbit(track),
      ) ?? null
    );
  }, [props.selectedTrackId, props.tracks]);

  return (
    <Canvas camera={{ position: [0, 0, 3.15], fov: 42 }}>
      <color attach="background" args={["#010409"]} />
      <fog attach="fog" args={["#010409", 2.9, 7]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 2, 3]} intensity={2.6} color="#f4f8ff" />
      <pointLight position={[-3, -1, -2]} intensity={0.8} color="#204fdd" />
      <group rotation={[0.41, 0.2, 0]}>
        <Earth />
        <SelectedOrbit currentTime={props.currentTime} track={selectedTrack} />
        <SatelliteMarkers {...props} />
      </group>
      <Stars radius={90} depth={40} count={5000} factor={4} saturation={0} fade speed={0.35} />
      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={4.8}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}