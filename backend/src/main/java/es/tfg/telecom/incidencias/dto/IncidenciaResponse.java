package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.EstadoIncidencia;
import es.tfg.telecom.incidencias.entity.FranjaHoraria;
import es.tfg.telecom.incidencias.entity.Incidencia;
import es.tfg.telecom.incidencias.entity.TipoIncidencia;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class IncidenciaResponse {

    private Long id;
    private UsuarioSummaryDto cliente;
    private UsuarioSummaryDto tecnico;
    private TipoIncidencia tipo;
    private EstadoIncidencia estado;
    private String direccion;
    private String telefonoContacto;
    private String descripcion;
    private LocalDate fechaCita;
    private FranjaHoraria franja;
    private LocalTime horaInicioEstimada;
    private LocalTime horaFinEstimada;
    private Integer duracionEstimadaMinutos;
    private LocalDateTime ultimoAvisoAt;
    private boolean puedeAvisar; // Para indicar al frontend si el botón avisar está habilitado o en cooldown
    private Long segundosRestantesAviso; // Segundos restantes de cooldown si no puede avisar
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidenciaResponse() {}

    public IncidenciaResponse(Incidencia inc) {
        if (inc != null) {
            this.id = inc.getId();
            this.cliente = inc.getCliente() != null ? new UsuarioSummaryDto(inc.getCliente()) : null;
            this.tecnico = inc.getTecnico() != null ? new UsuarioSummaryDto(inc.getTecnico()) : null;
            this.tipo = inc.getTipo();
            this.estado = inc.getEstado();
            this.direccion = inc.getDireccion();
            this.telefonoContacto = inc.getTelefonoContacto();
            this.descripcion = inc.getDescripcion();
            this.fechaCita = inc.getFechaCita();
            this.franja = inc.getFranja();
            this.horaInicioEstimada = inc.getHoraInicioEstimada();
            this.horaFinEstimada = inc.getHoraFinEstimada();
            this.duracionEstimadaMinutos = inc.getDuracionEstimadaMinutos();
            this.ultimoAvisoAt = inc.getUltimoAvisoAt();
            this.createdAt = inc.getCreatedAt();
            this.updatedAt = inc.getUpdatedAt();

            // Cálculo del cooldown de 5 minutos (300 segundos)
            if (inc.getUltimoAvisoAt() == null) {
                this.puedeAvisar = true;
                this.segundosRestantesAviso = 0L;
            } else {
                long segundosTranscurridos = java.time.Duration.between(inc.getUltimoAvisoAt(), LocalDateTime.now()).getSeconds();
                if (segundosTranscurridos >= 300) {
                    this.puedeAvisar = true;
                    this.segundosRestantesAviso = 0L;
                } else {
                    this.puedeAvisar = false;
                    this.segundosRestantesAviso = 300 - segundosTranscurridos;
                }
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UsuarioSummaryDto getCliente() { return cliente; }
    public void setCliente(UsuarioSummaryDto cliente) { this.cliente = cliente; }

    public UsuarioSummaryDto getTecnico() { return tecnico; }
    public void setTecnico(UsuarioSummaryDto tecnico) { this.tecnico = tecnico; }

    public UsuarioSummaryDto getTecnicoAsignado() { return tecnico; }

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

    public boolean isPuedeAvisar() { return puedeAvisar; }
    public void setPuedeAvisar(boolean puedeAvisar) { this.puedeAvisar = puedeAvisar; }

    public Long getSegundosRestantesAviso() { return segundosRestantesAviso; }
    public void setSegundosRestantesAviso(Long segundosRestantesAviso) { this.segundosRestantesAviso = segundosRestantesAviso; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
