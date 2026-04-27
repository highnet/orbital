package com.orbital.api.track;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tracks")
public class TrackSnapshotController {

	private final TrackSnapshotService trackSnapshotService;

	public TrackSnapshotController(TrackSnapshotService trackSnapshotService) {
		this.trackSnapshotService = trackSnapshotService;
	}

	@GetMapping("/snapshot")
	public TrackSnapshotResponse snapshot() {
		return trackSnapshotService.currentSnapshot();
	}
}