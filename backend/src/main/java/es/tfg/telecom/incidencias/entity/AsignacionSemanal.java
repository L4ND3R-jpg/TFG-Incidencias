package es.tfg.telecom.incidencias.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "asignaciones_semanales",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tecnico_anio_semana", columnNames = {"tecnico_id", "anio", "semana"})
    }
)
public class AsignacionSemanal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    private Usuario tecnico;

    @Column(nullable = false)
    private Integer anio;

    @Column(nullable = false)
    private Integer semana;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_asignado", nullable = false, length = 20)
    private TipoAsignacion tipoAsignado;

    public AsignacionSemanal() {}

    public AsignacionSemanal(Long id, Usuario tecnico, Integer anio, Integer semana, TipoAsignacion tipoAsignado) {
        this.id = id;
        this.tecnico = tecnico;
        this.anio = anio;
        this.semana = semana;
        this.tipoAsignado = tipoAsignado;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public Integer getSemana() { return semana; }
    public void setSemana(Integer semana) { this.semana = semana; }

    public TipoAsignacion getTipoAsignado() { return tipoAsignado; }
    public void setTipoAsignado(TipoAsignacion tipoAsignado) { this.tipoAsignado = tipoAsignado; }
}
