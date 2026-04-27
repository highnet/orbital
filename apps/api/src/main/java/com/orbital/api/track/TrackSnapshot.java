package com.orbital.api.track;

import java.time.Instant;
import java.util.Map;

public record TrackSnapshot(
	String source,
	TrackType objectType,
	String objectId,
	String displayName,
	Double latitude,
	Double longitude,
	Double altitudeKm,
	Double velocityKps,
	Double heading,
	Instant timestamp,
	Map<String, Object> metadata
) {
}