package com.resqride.backend;

import com.resqride.backend.entity.Emergency;
import com.resqride.backend.repository.EmergencyRepository;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyRepository emergencyRepository;

    public EmergencyController(EmergencyRepository emergencyRepository) {
        this.emergencyRepository = emergencyRepository;
    }

    @PostMapping("/alert")
    public Map<String, Object> receiveEmergencyAlert(
            @RequestBody Map<String, Object> incident) {

        Object latitude = incident.get("latitude");
        Object longitude = incident.get("longitude");

        // Check whether rider location is available
        if (latitude == null || longitude == null) {
            return Map.of(
                    "status", "LOCATION_MISSING",
                    "message", "Waiting for a valid rider location."
            );
        }

        String mapsLink =
                "https://www.google.com/maps?q="
                + latitude + "," + longitude;

        // Get information sent by the frontend
        String riderName = String.valueOf(
                incident.getOrDefault("riderName", "Unknown Rider")
        );

        String emergencyType = String.valueOf(
                incident.getOrDefault("emergencyType", "Emergency")
        );

        // Create database record
        Emergency emergency = new Emergency(
                riderName,
                mapsLink,
                emergencyType,
                "ACTIVE"
        );

        // Save emergency into Neon PostgreSQL
        emergencyRepository.save(emergency);

        // Send response back to frontend
        return Map.of(
                "status", "DEMO_RECEIVED",
                "message", "Emergency incident received by ResQRide backend. No contacts notified yet.",
                "incidentTime", Instant.now().toString(),
                "latitude", latitude,
                "longitude", longitude,
                "mapsLink", mapsLink
        );
    }
}