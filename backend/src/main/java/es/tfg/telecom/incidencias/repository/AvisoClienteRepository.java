package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.AvisoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AvisoClienteRepository extends JpaRepository<AvisoCliente, Long> {
    List<AvisoCliente> findByIncidenciaIdOrderByFechaHoraDesc(Long incidenciaId);
    Optional<AvisoCliente> findTopByIncidenciaIdOrderByFechaHoraDesc(Long incidenciaId);
}
