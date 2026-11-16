package com.campuscare.repository;

import com.campuscare.model.Role;
import com.campuscare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleOrderByFullNameAsc(Role role);

    List<User> findByRoleAndActiveTrueOrderByFullNameAsc(Role role);

    long countByRole(Role role);

    long countByRoleAndActiveTrue(Role role);

    @Query("""
            select u from User u
            where (:role is null or u.role = :role)
              and (:search = '' or lower(u.fullName) like lower(concat('%', :search, '%'))
                   or lower(u.email) like lower(concat('%', :search, '%')))
            order by u.createdAt desc
            """)
    List<User> searchUsers(@Param("role") Role role, @Param("search") String search);
}
