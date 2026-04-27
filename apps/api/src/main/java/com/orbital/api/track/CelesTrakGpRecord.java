package com.orbital.api.track;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CelesTrakGpRecord(
	@JsonProperty("OBJECT_NAME") String objectName,
	@JsonProperty("OBJECT_ID") String objectId,
	@JsonProperty("EPOCH") String epoch,
	@JsonProperty("MEAN_MOTION") double meanMotion,
	@JsonProperty("ECCENTRICITY") double eccentricity,
	@JsonProperty("INCLINATION") double inclination,
	@JsonProperty("RA_OF_ASC_NODE") double rightAscensionOfAscendingNode,
	@JsonProperty("ARG_OF_PERICENTER") double argumentOfPericenter,
	@JsonProperty("MEAN_ANOMALY") double meanAnomaly,
	@JsonProperty("EPHEMERIS_TYPE") int ephemerisType,
	@JsonProperty("CLASSIFICATION_TYPE") String classificationType,
	@JsonProperty("NORAD_CAT_ID") int noradCatId,
	@JsonProperty("ELEMENT_SET_NO") int elementSetNumber,
	@JsonProperty("REV_AT_EPOCH") int revolutionAtEpoch,
	@JsonProperty("BSTAR") double bstar,
	@JsonProperty("MEAN_MOTION_DOT") double meanMotionDot,
	@JsonProperty("MEAN_MOTION_DDOT") double meanMotionDdot
) {

	boolean isRenderable() {
		return objectName != null
			&& !objectName.isBlank()
			&& objectId != null
			&& !objectId.isBlank()
			&& epoch != null
			&& !epoch.isBlank()
			&& meanMotion > 0;
	}

	Map<String, Object> toMetadata() {
		return Map.of(
			"noradId", Integer.toString(noradCatId),
			"classification", classificationType,
			"gp", Map.ofEntries(
				Map.entry("OBJECT_NAME", objectName),
				Map.entry("OBJECT_ID", objectId),
				Map.entry("EPOCH", epoch),
				Map.entry("MEAN_MOTION", meanMotion),
				Map.entry("ECCENTRICITY", eccentricity),
				Map.entry("INCLINATION", inclination),
				Map.entry("RA_OF_ASC_NODE", rightAscensionOfAscendingNode),
				Map.entry("ARG_OF_PERICENTER", argumentOfPericenter),
				Map.entry("MEAN_ANOMALY", meanAnomaly),
				Map.entry("EPHEMERIS_TYPE", ephemerisType),
				Map.entry("CLASSIFICATION_TYPE", classificationType),
				Map.entry("NORAD_CAT_ID", noradCatId),
				Map.entry("ELEMENT_SET_NO", elementSetNumber),
				Map.entry("REV_AT_EPOCH", revolutionAtEpoch),
				Map.entry("BSTAR", bstar),
				Map.entry("MEAN_MOTION_DOT", meanMotionDot),
				Map.entry("MEAN_MOTION_DDOT", meanMotionDdot)
			)
		);
	}
}