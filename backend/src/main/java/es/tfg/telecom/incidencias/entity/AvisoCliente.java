package es.tfg.telecom.incidencias.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "avisos_clientes")
public class AvisoCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incidencia_id", nullable = false)
    private Incidencia incidencia;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    private Usuario tecnico;

    @CreationTimestamp
    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private LocalDateTime fechaHora;

    @Column(length = 50)
    private String canal = "EMAIL_Y_WEB";

    public AvisoCliente() {}

    public AvisoCliente(Incidencia incidencia, Usuario tecnico, String canal) {
        this.incidencia = incidencia;
        this.tecnico = tecnico;
        this.canal = canal != null ? canal : "EMAIL_Y_WEB";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Incidencia getIncidencia() { return incidencia; }
    public void setIncidencia(Incidencia incidencia) { this.incidencia = incidencia; }

    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }

    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
}
