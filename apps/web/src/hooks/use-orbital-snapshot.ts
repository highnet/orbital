"use client";

import { useEffect, useState } from "react";

import type { TrackSnapshotResponse } from "@/lib/orbital";

const SNAPSHOT_PATH = "/api/orbital/v1/tracks/snapshot";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type SnapshotState = {
  data: TrackSnapshotResponse | null;
  error: string | null;
  isLoading: boolean;
};

export function useOrbitalSnapshot() {
  const [state, setState] = useState<SnapshotState>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadSnapshot = async () => {
      try {
        const response = await fetch(SNAPSHOT_PATH, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Snapshot request failed with ${response.status}.`);
        }

        const data = (await response.json()) as TrackSnapshotResponse;

        if (!isMounted) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setState((previous) => ({
          data: previous.data,
          error:
            error instanceof Error
              ? error.message
              : "Could not load the live orbital snapshot.",
          isLoading: false,
        }));
      }
    };

    void loadSnapshot();
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  return state;
}