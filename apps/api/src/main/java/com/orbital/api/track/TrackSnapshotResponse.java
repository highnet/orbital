package com.orbital.api.track;

import java.time.Instant;
import java.util.List;

public record TrackSnapshotResponse(
	Instant generatedAt,
	List<TrackSnapshot> tracks
) {
}