package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.Rol;
import es.tfg.telecom.incidencias.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findByRolAndActivoTrue(Rol rol);
}
