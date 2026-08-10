package com.fitnessai.backend.repositories;

import com.fitnessai.backend.entities.AiCoachRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiCoachRecommendationRepository extends JpaRepository<AiCoachRecommendation, Long> {
    List<AiCoachRecommendation> findByUserId(Long userId);
}
