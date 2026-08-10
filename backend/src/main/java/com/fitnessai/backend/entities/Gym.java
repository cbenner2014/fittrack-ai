package com.fitnessai.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gyms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gym {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_place_id", unique = true)
    private String googlePlaceId;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column
    private Double latitude;

    @Column
    private Double longitude;
}
