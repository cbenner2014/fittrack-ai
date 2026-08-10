package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.GymRequestDto;
import com.fitnessai.backend.dtos.response.GymResponseDto;
import com.fitnessai.backend.entities.Gym;

public class GymMapper {
    public static Gym toEntity(GymRequestDto dto) {
        if (dto == null) return null;
        Gym gym = new Gym();
        gym.setGooglePlaceId(dto.getGooglePlaceId());
        gym.setName(dto.getName());
        gym.setAddress(dto.getAddress());
        gym.setLatitude(dto.getLatitude());
        gym.setLongitude(dto.getLongitude());
        return gym;
    }
    public static GymResponseDto toResponseDto(Gym gym) {
        if (gym == null) return null;
        GymResponseDto dto = new GymResponseDto();
        dto.setId(gym.getId());
        dto.setGooglePlaceId(gym.getGooglePlaceId());
        dto.setName(gym.getName());
        dto.setAddress(gym.getAddress());
        dto.setLatitude(gym.getLatitude());
        dto.setLongitude(gym.getLongitude());
        return dto;
    }
}
