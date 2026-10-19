package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.AsignacionSemanal;
import es.tfg.telecom.incidencias.entity.TipoAsignacion;

public class AsignacionSemanalResponse {

    private Long id;
    private UsuarioSummaryDto tecnico;
    private Integer anio;
    private Integer semana;
    private TipoAsignacion tipoAsignado;

    public AsignacionSemanalResponse() {}

    public AsignacionSemanalResponse(AsignacionSemanal asig) {
        if (asig != null) {
            this.id = asig.getId();
            this.tecnico = asig.getTecnico() != null ? new UsuarioSummaryDto(asig.getTecnico()) : null;
            this.anio = asig.getAnio();
            this.semana = asig.getSemana();
            this.tipoAsignado = asig.getTipoAsignado();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UsuarioSummaryDto getTecnico() { return tecnico; }
    public void setTecnico(UsuarioSummaryDto tecnico) { this.tecnico = tecnico; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public Integer getSemana() { return semana; }
    public void setSemana(Integer semana) { this.semana = semana; }

    public TipoAsignacion getTipoAsignado() { return tipoAsignado; }
    public void setTipoAsignado(TipoAsignacion tipoAsignado) { this.tipoAsignado = tipoAsignado; }
}
