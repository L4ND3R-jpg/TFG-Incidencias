package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.EstadoIncidencia;
import jakarta.validation.constraints.NotNull;

public class CambiarEstadoRequest {

    @NotNull(message = "El nuevo estado es obligatorio")
    private EstadoIncidencia nuevoEstado;

    public CambiarEstadoRequest() {}

    public CambiarEstadoRequest(EstadoIncidencia nuevoEstado) {
        this.nuevoEstado = nuevoEstado;
    }

    public EstadoIncidencia getNuevoEstado() { return nuevoEstado; }
    public void setNuevoEstado(EstadoIncidencia nuevoEstado) { this.nuevoEstado = nuevoEstado; }
}
