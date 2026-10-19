package es.tfg.telecom.incidencias.dto;

import jakarta.validation.constraints.NotNull;

public class ReasignarIncidenciaRequest {

    @NotNull(message = "El ID del técnico es obligatorio")
    private Long tecnicoId;

    public ReasignarIncidenciaRequest() {}

    public ReasignarIncidenciaRequest(Long tecnicoId) {
        this.tecnicoId = tecnicoId;
    }

    public Long getTecnicoId() { return tecnicoId; }
    public void setTecnicoId(Long tecnicoId) { this.tecnicoId = tecnicoId; }
}
