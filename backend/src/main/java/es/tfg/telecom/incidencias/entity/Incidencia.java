package es.tfg.telecom.incidencias.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "incidencias")
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoIncidencia tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoIncidencia estado = EstadoIncidencia.PENDIENTE;

    @Column(nullable = false, length = 255)
    private String direccion;

    @Column(name = "telefono_contacto", nullable = false, length = 25)
    private String telefonoContacto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_cita")
    private LocalDate fechaCita;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private FranjaHoraria franja;

    @Column(name = "hora_inicio_estimada")
    private LocalTime horaInicioEstimada;

    @Column(name = "hora_fin_estimada")
    private LocalTime horaFinEstimada;

    @Column(name = "duracion_estimada_minutos")
    private Integer duracionEstimadaMinutos;

    @Column(name = "ultimo_aviso_at")
    private LocalDateTime ultimoAvisoAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Incidencia() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }

    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }

    public TipoIncidencia getTipo() { return tipo; }
    public void setTipo(TipoIncidencia tipo) { this.tipo = tipo; }

    public EstadoIncidencia getEstado() { return estado; }
    public void setEstado(EstadoIncidencia estado) { this.estado = estado; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDate getFechaCita() { return fechaCita; }
    public void setFechaCita(LocalDate fechaCita) { this.fechaCita = fechaCita; }

    public FranjaHoraria getFranja() { return franja; }
    public void setFranja(FranjaHoraria franja) { this.franja = franja; }

    public LocalTime getHoraInicioEstimada() { return horaInicioEstimada; }
    public void setHoraInicioEstimada(LocalTime horaInicioEstimada) { this.horaInicioEstimada = horaInicioEstimada; }

    public LocalTime getHoraFinEstimada() { return horaFinEstimada; }
    public void setHoraFinEstimada(LocalTime horaFinEstimada) { this.horaFinEstimada = horaFinEstimada; }

    public Integer getDuracionEstimadaMinutos() { return duracionEstimadaMinutos; }
    public void setDuracionEstimadaMinutos(Integer duracionEstimadaMinutos) { this.duracionEstimadaMinutos = duracionEstimadaMinutos; }

    public LocalDateTime getUltimoAvisoAt() { return ultimoAvisoAt; }
    public void setUltimoAvisoAt(LocalDateTime ultimoAvisoAt) { this.ultimoAvisoAt = ultimoAvisoAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
