package com.marketplace.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServicePackageRepository extends JpaRepository<ServicePackage, UUID> {
    List<ServicePackage> findByServiceId(UUID serviceId);

    @Query(value = "SELECT sp.* FROM service_packages sp JOIN services s ON sp.service_id = s.id WHERE s.provider_id = :providerId", nativeQuery = true)
    List<ServicePackage> findByProviderId(@Param("providerId") UUID providerId);
}
