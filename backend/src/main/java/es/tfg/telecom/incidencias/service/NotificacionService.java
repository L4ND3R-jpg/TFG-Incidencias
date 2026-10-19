package es.tfg.telecom.incidencias.service;

import es.tfg.telecom.incidencias.dto.NotificacionResponse;
import es.tfg.telecom.incidencias.entity.Notificacion;
import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.NotificacionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final NotificacionRepository notificacionRepository;
    private final JavaMailSender mailSender;

    public NotificacionService(NotificacionRepository notificacionRepository, JavaMailSender mailSender) {
        this.notificacionRepository = notificacionRepository;
        this.mailSender = mailSender;
    }

    /**
     * Crea y guarda una notificación en la base de datos (notificación interna en la web).
     */
    @Transactional
    public Notificacion crearNotificacion(Usuario usuario, String titulo, String mensaje, Long incidenciaId) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuario);
        notificacion.setTitulo(titulo);
        notificacion.setMensaje(mensaje);
        notificacion.setIncidenciaId(incidenciaId);
        notificacion.setLeida(false);

        log.info("Notificación web guardada para [{}]: {}", usuario.getEmail(), titulo);
        return notificacionRepository.save(notificacion);
    }

    /**
     * Envía un correo electrónico. En entorno de desarrollo captura excepciones
     * de conexión si el servidor SMTP local no está levantado, registrando el log.
     */
    public void enviarEmail(String destinatario, String asunto, String cuerpo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("notificaciones@telecom.es");
            message.setTo(destinatario);
            message.setSubject(asunto);
            message.setText(cuerpo);

            mailSender.send(message);
            log.info("Email enviado con éxito a {}: {}", destinatario, asunto);
        } catch (Exception e) {
            log.warn("No se pudo enviar el email a {} (simulado en log): {}", destinatario, e.getMessage());
        }
    }

    public List<NotificacionResponse> listarNotificacionesUsuario(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId)
                .stream()
                .map(NotificacionResponse::new)
                .collect(Collectors.toList());
    }

    public List<NotificacionResponse> listarNoLeidas(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdAndLeidaFalseOrderByFechaCreacionDesc(usuarioId)
                .stream()
                .map(NotificacionResponse::new)
                .collect(Collectors.toList());
    }

    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public void marcarComoLeida(Long notificacionId, Long usuarioId) {
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada con ID: " + notificacionId));

        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Solo puedes marcar como leídas tus propias notificaciones");
        }

        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void marcarTodasComoLeidas(Long usuarioId) {
        List<Notificacion> noLeidas = notificacionRepository.findByUsuarioIdAndLeidaFalseOrderByFechaCreacionDesc(usuarioId);
        noLeidas.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(noLeidas);
    }
}
