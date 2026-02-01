import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Html,
  KeyboardControls,
} from "@react-three/drei";
import { FirstPersonController } from "../fps/FirstPersonController";

const Campus3D = React.lazy(() => import("../../Campus3D"));

function Loader3D() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
        <div className="w-10 h-10 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-bold text-xs tracking-widest bg-black/50 px-2 py-1 rounded">
          CARGANDO 3D...
        </div>
      </div>
    </Html>
  );
}

export function Scene3D({
  isFpsMode,
  isTransitioning,
  userFacultyId,
  locations,
  events,
  targetLocation,
  onEdificioClick,
  onEventFound,
  onVisitRegistered
}) {
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "w", "W"] },
    { name: "backward", keys: ["ArrowDown", "s", "S"] },
    { name: "left", keys: ["ArrowLeft", "a", "A"] },
    { name: "right", keys: ["ArrowRight", "d", "D"] },
  ];

  return (
    <div className="absolute inset-0 z-0">
      <KeyboardControls map={keyboardMap}>
        <Canvas
          camera={{ position: [60, 60, 60], fov: 45 }}
          shadows
          dpr={[1, 1.5]}
        >
          <Suspense fallback={<Loader3D />}>
            <Campus3D
              userFacultyId={userFacultyId}
              isFpsMode={isFpsMode}
              onEdificioClick={onEdificioClick}
              targetLocation={targetLocation}
              locations={locations}
              events={events}
              onEventFound={onEventFound}
              onVisitRegistered={onVisitRegistered}
            />
            <Environment preset="city" />
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[50, 80, 30]}
              intensity={1.5}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
          </Suspense>

          {!isTransitioning && (
            <>
              {isFpsMode ? (
                <FirstPersonController active={isFpsMode} speed={40} />
              ) : (
                <OrbitControls
                  makeDefault
                  minPolarAngle={0}
                  maxPolarAngle={Math.PI / 2.1}
                  minDistance={50}
                  maxDistance={150}
                  enableDamping={true}
                  dampingFactor={0.05}
                />
              )}
            </>
          )}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}