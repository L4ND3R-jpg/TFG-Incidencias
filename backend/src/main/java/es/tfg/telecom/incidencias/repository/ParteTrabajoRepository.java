package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.ParteTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParteTrabajoRepository extends JpaRepository<ParteTrabajo, Long> {
    Optional<ParteTrabajo> findByIncidenciaId(Long incidenciaId);
    boolean existsByIncidenciaId(Long incidenciaId);
    List<ParteTrabajo> findByTecnicoIdOrderByFechaDesc(Long tecnicoId);
    List<ParteTrabajo> findAllByOrderByFechaDesc();
}
