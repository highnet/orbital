import * as satellite from "satellite.js";
import { Vector3 } from "three";

export type CelesTrakGpMetadata = {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
};

export type CelesTrakTleMetadata = {
  name: string;
  line1: string;
  line2: string;
};

export type TrackSnapshot = {
  source: string;
  objectType: "SATELLITE" | "AIRCRAFT" | "VESSEL";
  objectId: string;
  displayName: string;
  latitude: number | null;
  longitude: number | null;
  altitudeKm: number | null;
  velocityKps: number | null;
  heading: number | null;
  timestamp: string;
  metadata: {
    noradId?: string;
    classification?: string;
    gp?: CelesTrakGpMetadata;
    tle?: CelesTrakTleMetadata;
  };
};

export type TrackSnapshotResponse = {
  generatedAt: string;
  tracks: TrackSnapshot[];
};

export type PropagatedTrackPosition = {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKps: number;
};

const EARTH_RADIUS = 1;
const MAX_ALTITUDE_SCALE = 0.32;
const DEFAULT_ORBIT_PERIOD_MINUTES = 92;

export function propagateTrackPosition(
  track: TrackSnapshot,
  when: Date,
): PropagatedTrackPosition | null {
  const gpMetadata = track.metadata.gp;

  if (!gpMetadata) {
    const tleMetadata = track.metadata.tle;

    if (!tleMetadata) {
      return null;
    }

    const satrec = satellite.twoline2satrec(tleMetadata.line1, tleMetadata.line2);
    const propagation = satellite.propagate(satrec, when);

    if (!propagation.position || !propagation.velocity) {
      return null;
    }

    const gmst = satellite.gstime(when);
    const geodetic = satellite.eciToGeodetic(propagation.position, gmst);
    const velocityKps = Math.sqrt(
      propagation.velocity.x ** 2 +
        propagation.velocity.y ** 2 +
        propagation.velocity.z ** 2,
    );

    return {
      latitude: satellite.degreesLat(geodetic.latitude),
      longitude: satellite.degreesLong(geodetic.longitude),
      altitudeKm: geodetic.height,
      velocityKps,
    };
  }

  const satrec = satellite.json2satrec(
    gpMetadata as Parameters<typeof satellite.json2satrec>[0],
  );
  const propagation = satellite.propagate(satrec, when);

  if (!propagation.position || !propagation.velocity) {
    return null;
  }

  const gmst = satellite.gstime(when);
  const geodetic = satellite.eciToGeodetic(propagation.position, gmst);
  const velocityKps = Math.sqrt(
    propagation.velocity.x ** 2 +
      propagation.velocity.y ** 2 +
      propagation.velocity.z ** 2,
  );

  return {
    latitude: satellite.degreesLat(geodetic.latitude),
    longitude: satellite.degreesLong(geodetic.longitude),
    altitudeKm: geodetic.height,
    velocityKps,
  };
}

export function trackPositionToVector3(position: PropagatedTrackPosition) {
  const latitude = (position.latitude * Math.PI) / 180;
  const longitude = (position.longitude * Math.PI) / 180;
  const altitudeScale = Math.min(
    MAX_ALTITUDE_SCALE,
    Math.max(0.015, position.altitudeKm / 20000),
  );
  const radius = EARTH_RADIUS + altitudeScale;

  return new Vector3(
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  );
}

export function sampleTrackOrbit(
  track: TrackSnapshot,
  centerTime: Date,
  sampleCount = 180,
) {
  const orbitPeriodMinutes = getOrbitPeriodMinutes(track);
  const halfWindowMs = orbitPeriodMinutes * 60 * 1000 * 0.5;
  const points: Vector3[] = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount;
    const sampleTime = new Date(centerTime.getTime() - halfWindowMs + progress * halfWindowMs * 2);
    const propagatedPosition = propagateTrackPosition(track, sampleTime);

    if (!propagatedPosition) {
      continue;
    }

    points.push(trackPositionToVector3(propagatedPosition).multiplyScalar(1.01));
  }

  return points;
}

function getOrbitPeriodMinutes(track: TrackSnapshot) {
  const gpMeanMotion = track.metadata.gp?.MEAN_MOTION;

  if (gpMeanMotion && gpMeanMotion > 0) {
    return 1440 / gpMeanMotion;
  }

  const tleLine2 = track.metadata.tle?.line2;

  if (tleLine2) {
    const meanMotionToken = tleLine2.slice(52, 63).trim();
    const meanMotion = meanMotionToken ? Number.parseFloat(meanMotionToken) : Number.NaN;

    if (Number.isFinite(meanMotion) && meanMotion > 0) {
      return 1440 / meanMotion;
    }
  }

  return DEFAULT_ORBIT_PERIOD_MINUTES;
}

export function formatTrackEpoch(epoch: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(epoch));
}

export function hasRenderableOrbit(track: TrackSnapshot) {
  return Boolean(track.metadata.gp || track.metadata.tle);
}

export function formatLatitude(latitude: number) {
  return `${Math.abs(latitude).toFixed(2)} deg ${latitude >= 0 ? "N" : "S"}`;
}

export function formatLongitude(longitude: number) {
  return `${Math.abs(longitude).toFixed(2)} deg ${longitude >= 0 ? "E" : "W"}`;
}