package es.tfg.telecom.incidencias.repository;

import es.tfg.telecom.incidencias.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);
    List<Notificacion> findByUsuarioIdAndLeidaFalseOrderByFechaCreacionDesc(Long usuarioId);
    long countByUsuarioIdAndLeidaFalse(Long usuarioId);
}
