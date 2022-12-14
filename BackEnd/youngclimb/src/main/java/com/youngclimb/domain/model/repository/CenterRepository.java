package com.youngclimb.domain.model.repository;

import com.youngclimb.domain.model.entity.Center;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CenterRepository extends JpaRepository<Center, Integer>  {

}
