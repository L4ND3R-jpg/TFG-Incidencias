package es.tfg.telecom.incidencias.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "partes_trabajo")
public class ParteTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "incidencia_id", nullable = false, unique = true)
    private Incidencia incidencia;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    private Usuario tecnico;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio_real", nullable = false)
    private LocalTime horaInicioReal;

    @Column(name = "hora_fin_real", nullable = false)
    private LocalTime horaFinReal;

    @Column(name = "descripcion_realizado", nullable = false, columnDefinition = "TEXT")
    private String descripcionRealizado;

    @OneToMany(mappedBy = "parteTrabajo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ExtraCobrable> extras = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ParteTrabajo() {}

    public void addExtra(ExtraCobrable extra) {
        extras.add(extra);
        extra.setParteTrabajo(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Incidencia getIncidencia() { return incidencia; }
    public void setIncidencia(Incidencia incidencia) { this.incidencia = incidencia; }

    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHoraInicioReal() { return horaInicioReal; }
    public void setHoraInicioReal(LocalTime horaInicioReal) { this.horaInicioReal = horaInicioReal; }

    public LocalTime getHoraFinReal() { return horaFinReal; }
    public void setHoraFinReal(LocalTime horaFinReal) { this.horaFinReal = horaFinReal; }

    public String getDescripcionRealizado() { return descripcionRealizado; }
    public void setDescripcionRealizado(String descripcionRealizado) { this.descripcionRealizado = descripcionRealizado; }

    public List<ExtraCobrable> getExtras() { return extras; }
    public void setExtras(List<ExtraCobrable> extras) { this.extras = extras; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
