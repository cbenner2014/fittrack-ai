package com.fitnessai.backend.repositories;

import com.fitnessai.backend.entities.BodyProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BodyProgressLogRepository extends JpaRepository<BodyProgressLog, Long> {
    List<BodyProgressLog> findByUserId(Long userId);
    List<BodyProgressLog> findByUserIdOrderByLogDateDesc(Long userId);
}
