package com.orbital.api.track;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TrackSnapshotService {

	private static final Logger logger = LoggerFactory.getLogger(TrackSnapshotService.class);
	private static final Duration FAILURE_RETRY_WINDOW = Duration.ofSeconds(30);
	private static final Pattern MULTIPLE_SPACES = Pattern.compile("\\s+");

	private final Object cacheMonitor = new Object();
	private final RestClient restClient;
	private final String celesTrakGroup;
	private final Duration cacheDuration;
	private final int snapshotLimit;
	private final String tleFallbackPath;

	private volatile CachedSnapshot cachedSnapshot;

	public TrackSnapshotService(
		@Value("${orbital.celestrak.group}") String celesTrakGroup,
		@Value("${orbital.celestrak.cache-duration}") Duration cacheDuration,
		@Value("${orbital.celestrak.limit}") int snapshotLimit,
		@Value("${orbital.celestrak.tle-fallback-path}") String tleFallbackPath
	) {
		this.restClient = RestClient.builder()
			.baseUrl("https://celestrak.org")
			.build();
		this.celesTrakGroup = celesTrakGroup;
		this.cacheDuration = cacheDuration;
		this.snapshotLimit = snapshotLimit;
		this.tleFallbackPath = tleFallbackPath;
	}

	public TrackSnapshotResponse currentSnapshot() {
		Instant now = Instant.now();
		CachedSnapshot currentCache = cachedSnapshot;

		if (currentCache != null && currentCache.isFreshAt(now)) {
			return currentCache.response();
		}

		synchronized (cacheMonitor) {
			CachedSnapshot refreshedCache = cachedSnapshot;

			if (refreshedCache != null && refreshedCache.isFreshAt(now)) {
				return refreshedCache.response();
			}

			cachedSnapshot = fetchSnapshot(now, refreshedCache);
			return cachedSnapshot.response();
		}
	}

	private CachedSnapshot fetchSnapshot(Instant fetchedAt, CachedSnapshot previousCache) {
		try {
			CelesTrakGpRecord[] response = restClient.get()
				.uri(uriBuilder -> uriBuilder
					.path("/NORAD/elements/gp.php")
					.queryParam("GROUP", celesTrakGroup)
					.queryParam("FORMAT", "json")
					.build())
				.retrieve()
				.body(CelesTrakGpRecord[].class);

			if (response == null) {
				throw new IllegalStateException("CelesTrak response body was empty.");
			}

			List<TrackSnapshot> tracks = Arrays.stream(response)
				.filter(CelesTrakGpRecord::isRenderable)
				.limit(snapshotLimit)
				.map(this::toTrackSnapshot)
				.toList();

			TrackSnapshotResponse snapshotResponse = new TrackSnapshotResponse(fetchedAt, tracks);
			return new CachedSnapshot(snapshotResponse, fetchedAt.plus(cacheDuration));
		} catch (RuntimeException exception) {
			logger.warn("Failed to refresh GP JSON for group '{}': {}", celesTrakGroup, exception.getMessage());

			try {
				TrackSnapshotResponse fallbackResponse = fetchTleFallbackSnapshot(fetchedAt);
				return new CachedSnapshot(fallbackResponse, fetchedAt.plus(cacheDuration));
			} catch (RuntimeException fallbackException) {
				logger.warn("Failed to refresh TLE fallback feed '{}': {}", tleFallbackPath, fallbackException.getMessage());
			}

			if (previousCache != null) {
				return previousCache.extendUntil(fetchedAt.plus(FAILURE_RETRY_WINDOW));
			}

			return new CachedSnapshot(new TrackSnapshotResponse(fetchedAt, List.of()), fetchedAt.plus(FAILURE_RETRY_WINDOW));
		}
	}

	private TrackSnapshot toTrackSnapshot(CelesTrakGpRecord record) {
		return new TrackSnapshot(
			"celestrak",
			TrackType.SATELLITE,
			Integer.toString(record.noradCatId()),
			record.objectName(),
			null,
			null,
			null,
			null,
			null,
			Instant.parse(record.epoch()),
			record.toMetadata()
		);
	}

	private TrackSnapshotResponse fetchTleFallbackSnapshot(Instant fetchedAt) {
		String tleBody = restClient.get()
			.uri(tleFallbackPath)
			.retrieve()
			.body(String.class);

		if (tleBody == null || tleBody.isBlank()) {
			throw new IllegalStateException("CelesTrak TLE fallback body was empty.");
		}

		List<String> lines = tleBody.lines()
			.map(String::stripTrailing)
			.filter(line -> !line.isBlank())
			.toList();

		List<TrackSnapshot> tracks = java.util.stream.IntStream.range(0, lines.size() / 3)
			.map(index -> index * 3)
			.mapToObj(index -> toTleTrackSnapshot(lines.get(index), lines.get(index + 1), lines.get(index + 2), fetchedAt))
			.limit(snapshotLimit)
			.toList();

		if (tracks.isEmpty()) {
			String preview = tleBody.length() > 240 ? tleBody.substring(0, 240) : tleBody;
			throw new IllegalStateException("CelesTrak TLE fallback did not contain any parseable tracks. Preview: " + preview.replace('\n', ' ').replace('\r', ' '));
		}

		return new TrackSnapshotResponse(fetchedAt, tracks);
	}

	private TrackSnapshot toTleTrackSnapshot(String name, String line1, String line2, Instant fetchedAt) {
		String normalizedName = name.strip();
		String objectId = extractNoradId(line1);

		return new TrackSnapshot(
			"celestrak",
			TrackType.SATELLITE,
			objectId,
			normalizedName,
			null,
			null,
			null,
			null,
			null,
			fetchedAt,
			Map.of(
				"noradId", objectId,
				"tle", Map.of(
					"name", normalizedName,
					"line1", line1,
					"line2", line2
				)
			)
		);
	}

	private String extractNoradId(String line1) {
		String[] parts = MULTIPLE_SPACES.split(line1.strip());

		if (parts.length < 2 || parts[1].length() < 5) {
			return line1.strip();
		}

		return parts[1].substring(0, 5);
	}

	private record CachedSnapshot(TrackSnapshotResponse response, Instant expiresAt) {

		boolean isFreshAt(Instant now) {
			return expiresAt.isAfter(now);
		}

		CachedSnapshot extendUntil(Instant nextExpiration) {
			return new CachedSnapshot(response, nextExpiration);
		}
	}
}