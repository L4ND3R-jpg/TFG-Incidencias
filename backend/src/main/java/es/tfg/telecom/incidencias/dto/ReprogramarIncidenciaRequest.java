package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.FranjaHoraria;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public class ReprogramarIncidenciaRequest {

    @NotNull(message = "La nueva fecha de la cita es obligatoria")
    @Future(message = "La fecha de reprogramación debe ser futura")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaCita;

    // Obligatorio para AVERIA
    private FranjaHoraria franja;

    // Obligatorio para FIBRA
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime horaInicioEstimada;

    public ReprogramarIncidenciaRequest() {}

    public LocalDate getFechaCita() { return fechaCita; }
    public void setFechaCita(LocalDate fechaCita) { this.fechaCita = fechaCita; }

    public FranjaHoraria getFranja() { return franja; }
    public void setFranja(FranjaHoraria franja) { this.franja = franja; }

    public LocalTime getHoraInicioEstimada() { return horaInicioEstimada; }
    public void setHoraInicioEstimada(LocalTime horaInicioEstimada) { this.horaInicioEstimada = horaInicioEstimada; }
}
