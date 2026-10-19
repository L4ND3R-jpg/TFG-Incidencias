package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.AsignacionSemanal;
import es.tfg.telecom.incidencias.entity.TipoAsignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AsignacionSemanalRepository extends JpaRepository<AsignacionSemanal, Long> {
    List<AsignacionSemanal> findByAnioAndSemana(Integer anio, Integer semana);
    List<AsignacionSemanal> findByAnioAndSemanaAndTipoAsignado(Integer anio, Integer semana, TipoAsignacion tipoAsignado);
    Optional<AsignacionSemanal> findByTecnicoIdAndAnioAndSemana(Long tecnicoId, Integer anio, Integer semana);
}
