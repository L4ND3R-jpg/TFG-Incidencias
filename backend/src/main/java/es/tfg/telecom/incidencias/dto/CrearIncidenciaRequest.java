package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.FranjaHoraria;
import es.tfg.telecom.incidencias.entity.TipoIncidencia;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO para que el CLIENTE registre una nueva incidencia.
 */
public class CrearIncidenciaRequest {

    @NotNull(message = "El tipo de incidencia es obligatorio (AVERIA o FIBRA)")
    private TipoIncidencia tipo;

    @NotBlank(message = "La dirección de la intervención es obligatoria")
    private String direccion;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    @Pattern(regexp = "^[0-9]{9,15}$", message = "El teléfono de contacto debe contener solo dígitos (entre 9 y 15)")
    private String telefonoContacto;

    @NotBlank(message = "La descripción de la incidencia es obligatoria")
    private String descripcion;

    @NotNull(message = "La fecha de la cita es obligatoria")
    @FutureOrPresent(message = "La fecha de la cita no puede ser anterior a hoy")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaCita;

    // Obligatorio solo si tipo == AVERIA (MANANA o TARDE)
    private FranjaHoraria franja;

    // Obligatorio solo si tipo == FIBRA (hora concreta de inicio)
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime horaInicioEstimada;

    // Duración estimada para FIBRA (entre 60 y 120 minutos)
    @Min(value = 60, message = "La duración mínima de instalación es 60 minutos (1h)")
    @Max(value = 120, message = "La duración máxima de instalación es 120 minutos (2h)")
    private Integer duracionEstimadaMinutos;

    public CrearIncidenciaRequest() {}

    public TipoIncidencia getTipo() { return tipo; }
    public void setTipo(TipoIncidencia tipo) { this.tipo = tipo; }

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

    public Integer getDuracionEstimadaMinutos() { return duracionEstimadaMinutos; }
    public void setDuracionEstimadaMinutos(Integer duracionEstimadaMinutos) { this.duracionEstimadaMinutos = duracionEstimadaMinutos; }
}
