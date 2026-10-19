package es.tfg.telecom.incidencias.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class CrearParteTrabajoRequest {

    @NotNull(message = "La fecha del parte de trabajo es obligatoria")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio real es obligatoria")
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime horaInicioReal;

    @NotNull(message = "La hora de fin real es obligatoria")
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime horaFinReal;

    @NotBlank(message = "La descripción del trabajo realizado es obligatoria")
    private String descripcionRealizado;

    @Valid
    private List<ExtraCobrableDto> extras = new ArrayList<>();

    public CrearParteTrabajoRequest() {}

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHoraInicioReal() { return horaInicioReal; }
    public void setHoraInicioReal(LocalTime horaInicioReal) { this.horaInicioReal = horaInicioReal; }

    public LocalTime getHoraFinReal() { return horaFinReal; }
    public void setHoraFinReal(LocalTime horaFinReal) { this.horaFinReal = horaFinReal; }

    public String getDescripcionRealizado() { return descripcionRealizado; }
    public void setDescripcionRealizado(String descripcionRealizado) { this.descripcionRealizado = descripcionRealizado; }

    public List<ExtraCobrableDto> getExtras() { return extras; }
    public void setExtras(List<ExtraCobrableDto> extras) { this.extras = extras; }
}
