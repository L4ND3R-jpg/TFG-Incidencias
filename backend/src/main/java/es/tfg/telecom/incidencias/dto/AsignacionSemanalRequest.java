package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.TipoAsignacion;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AsignacionSemanalRequest {

    @NotNull(message = "El ID del técnico es obligatorio")
    private Long tecnicoId;

    @NotNull(message = "El año es obligatorio")
    @Min(value = 2024, message = "El año mínimo es 2024")
    private Integer anio;

    @NotNull(message = "La semana es obligatoria (1-53)")
    @Min(value = 1, message = "La semana mínima es 1")
    @Max(value = 53, message = "La semana máxima es 53")
    private Integer semana;

    @NotNull(message = "El tipo de trabajo asignado es obligatorio (AVERIAS o FIBRA)")
    private TipoAsignacion tipoAsignado;

    public AsignacionSemanalRequest() {}

    public Long getTecnicoId() { return tecnicoId; }
    public void setTecnicoId(Long tecnicoId) { this.tecnicoId = tecnicoId; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public Integer getSemana() { return semana; }
    public void setSemana(Integer semana) { this.semana = semana; }

    public TipoAsignacion getTipoAsignado() { return tipoAsignado; }
    public void setTipoAsignado(TipoAsignacion tipoAsignado) { this.tipoAsignado = tipoAsignado; }
}
