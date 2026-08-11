package com.fitnessai.backend.repositories;

import com.fitnessai.backend.entities.MachineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MachineLogRepository extends JpaRepository<MachineLog, Long> {
    List<MachineLog> findByUserId(Long userId);
}
