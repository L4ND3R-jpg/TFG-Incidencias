package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.EstadoIncidencia;
import es.tfg.telecom.incidencias.entity.Incidencia;
import es.tfg.telecom.incidencias.entity.TipoIncidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Long> {

    List<Incidencia> findByClienteIdOrderByCreatedAtDesc(Long clienteId);

    List<Incidencia> findByTecnicoIdOrderByFechaCitaAsc(Long tecnicoId);

    // Incidencias del día asignadas a un técnico
    List<Incidencia> findByTecnicoIdAndFechaCita(Long tecnicoId, LocalDate fechaCita);

    // Incidencias asignadas a un técnico en un día que no estén cerradas
    List<Incidencia> findByTecnicoIdAndFechaCitaAndEstadoNot(Long tecnicoId, LocalDate fechaCita, EstadoIncidencia estado);

    // Para el gestor: ver todas ordenadas por creación
    List<Incidencia> findAllByOrderByCreatedAtDesc();

    // Buscar incidencias por estado
    List<Incidencia> findByEstado(EstadoIncidencia estado);

    // Contar incidencias activas asignadas a un técnico en una fecha (para balancear carga)
    long countByTecnicoIdAndFechaCitaAndEstadoNot(Long tecnicoId, LocalDate fechaCita, EstadoIncidencia estado);
}
