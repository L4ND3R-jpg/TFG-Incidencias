package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.Notificacion;

import java.time.LocalDateTime;

public class NotificacionResponse {

    private Long id;
    private String titulo;
    private String mensaje;
    private Boolean leida;
    private Long incidenciaId;
    private LocalDateTime fechaCreacion;

    public NotificacionResponse() {}

    public NotificacionResponse(Notificacion notif) {
        if (notif != null) {
            this.id = notif.getId();
            this.titulo = notif.getTitulo();
            this.mensaje = notif.getMensaje();
            this.leida = notif.getLeida();
            this.incidenciaId = notif.getIncidenciaId();
            this.fechaCreacion = notif.getFechaCreacion();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }

    public Long getIncidenciaId() { return incidenciaId; }
    public void setIncidenciaId(Long incidenciaId) { this.incidenciaId = incidenciaId; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
