package com.youngclimb.domain.model.repository;

import com.youngclimb.domain.model.entity.Center;
import com.youngclimb.domain.model.entity.Center3D;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface Center3DRepository extends JpaRepository<Center3D, Integer> {

    Optional<Center3D> findByCenter(Center center);

}
