"use client";

import { useEffect, useMemo, useState } from "react";

import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { useOrbitalSnapshot } from "@/hooks/use-orbital-snapshot";
import {
    formatLatitude,
    formatLongitude,
    formatTrackEpoch,
    propagateTrackPosition,
    type PropagatedTrackPosition,
    type CelesTrakGpMetadata,
    type CelesTrakTleMetadata,
    type TrackSnapshot,
} from "@/lib/orbital";

function SelectedTrackPanel({
  livePosition,
  track,
}: {
  livePosition: PropagatedTrackPosition | null;
  track: TrackSnapshot | null;
}) {
  const gpMetadata = track?.metadata.gp as CelesTrakGpMetadata | undefined;
  const tleMetadata = track?.metadata.tle as CelesTrakTleMetadata | undefined;

  if (!track || (!gpMetadata && !tleMetadata)) {
    return (
      <section className="rounded-[24px] border border-white/10 bg-white/6 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">
          Selection
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Select a satellite marker to inspect its live orbital element set.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/6 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">
        Selected satellite
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">{track.displayName}</h3>
      <dl className="mt-4 grid gap-3 text-sm text-slate-200">
        <div className="flex items-center justify-between gap-3">
          <dt>NORAD</dt>
          <dd>{track.objectId}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Object ID</dt>
          <dd>{gpMetadata?.OBJECT_ID ?? tleMetadata?.name}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Source</dt>
          <dd>{gpMetadata ? "GP JSON" : "TLE"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Latitude</dt>
          <dd>{livePosition ? formatLatitude(livePosition.latitude) : "Unavailable"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Longitude</dt>
          <dd>{livePosition ? formatLongitude(livePosition.longitude) : "Unavailable"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Altitude</dt>
          <dd>{livePosition ? `${livePosition.altitudeKm.toFixed(1)} km` : "Unavailable"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Velocity</dt>
          <dd>{livePosition ? `${livePosition.velocityKps.toFixed(2)} km/s` : "Unavailable"}</dd>
        </div>
        {gpMetadata ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt>Epoch</dt>
              <dd>{formatTrackEpoch(gpMetadata.EPOCH)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Inclination</dt>
              <dd>{gpMetadata.INCLINATION.toFixed(2)} deg</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Mean motion</dt>
              <dd>{gpMetadata.MEAN_MOTION.toFixed(4)} rev/day</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Eccentricity</dt>
              <dd>{gpMetadata.ECCENTRICITY.toFixed(6)}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt>TLE line 1</dt>
              <dd className="max-w-[14rem] truncate">{tleMetadata?.line1}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>TLE line 2</dt>
              <dd className="max-w-[14rem] truncate">{tleMetadata?.line2}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}

export default function Home() {
  const { data, error, isLoading } = useOrbitalSnapshot();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const firstTrack = data?.tracks[0];

    if (!selectedTrackId && firstTrack) {
      setSelectedTrackId(firstTrack.objectId);
    }

    if (
      selectedTrackId &&
      data &&
      !data.tracks.some((track) => track.objectId === selectedTrackId)
    ) {
      setSelectedTrackId(firstTrack?.objectId ?? null);
    }
  }, [data, selectedTrackId]);

  const selectedTrack = useMemo(() => {
    return data?.tracks.find((track) => track.objectId === selectedTrackId) ?? null;
  }, [data, selectedTrackId]);

  const selectedTrackPosition = useMemo(() => {
    if (!selectedTrack) {
      return null;
    }

    return propagateTrackPosition(selectedTrack, currentTime);
  }, [currentTime, selectedTrack]);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1e293b_0%,#08111f_40%,#04070d_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1.35fr)_380px] lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
                Orbital
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Live CelesTrak satellites on a textured earth
              </h1>
            </div>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-100">
              {isLoading ? "Loading" : `${data?.tracks.length ?? 0} live tracks`}
            </div>
          </div>

          <div className="h-[560px] pt-24 sm:h-[680px]">
            <GlobeCanvas
              currentTime={currentTime}
              tracks={data?.tracks ?? []}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
              Data pipeline
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Real orbital elements, browser-side propagation.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The backend now caches live GP JSON from CelesTrak and the frontend
              propagates those element sets into live positions with satellite.js,
              giving continuous motion instead of seeded demo paths.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                CelesTrak GP JSON
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                Satellite.js
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                Textured earth
              </span>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">
                Snapshot health
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <li>Source: CelesTrak active satellites</li>
                <li>Cache window: 5 minutes in Spring Boot</li>
                <li>Status: {error ? error : "Healthy"}</li>
              </ul>
            </div>
            <SelectedTrackPanel livePosition={selectedTrackPosition} track={selectedTrack} />
          </section>
        </aside>
      </div>
    </main>
  );
}
