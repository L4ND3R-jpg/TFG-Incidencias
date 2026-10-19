package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.ParteTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ParteTrabajoResponse {

    private Long id;
    private Long incidenciaId;
    private UsuarioSummaryDto tecnico;
    private LocalDate fecha;
    private LocalTime horaInicioReal;
    private LocalTime horaFinReal;
    private String descripcionRealizado;
    private List<ExtraCobrableDto> extras = new ArrayList<>();
    private BigDecimal totalExtras;
    private LocalDateTime createdAt;

    public ParteTrabajoResponse() {}

    public ParteTrabajoResponse(ParteTrabajo parte) {
        if (parte != null) {
            this.id = parte.getId();
            this.incidenciaId = parte.getIncidencia() != null ? parte.getIncidencia().getId() : null;
            this.tecnico = parte.getTecnico() != null ? new UsuarioSummaryDto(parte.getTecnico()) : null;
            this.fecha = parte.getFecha();
            this.horaInicioReal = parte.getHoraInicioReal();
            this.horaFinReal = parte.getHoraFinReal();
            this.descripcionRealizado = parte.getDescripcionRealizado();
            this.createdAt = parte.getCreatedAt();

            if (parte.getExtras() != null) {
                this.extras = parte.getExtras().stream()
                        .map(ExtraCobrableDto::new)
                        .collect(Collectors.toList());
                this.totalExtras = parte.getExtras().stream()
                        .map(e -> e.getImporte() != null ? e.getImporte() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            } else {
                this.totalExtras = BigDecimal.ZERO;
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIncidenciaId() { return incidenciaId; }
    public void setIncidenciaId(Long incidenciaId) { this.incidenciaId = incidenciaId; }

    public UsuarioSummaryDto getTecnico() { return tecnico; }
    public void setTecnico(UsuarioSummaryDto tecnico) { this.tecnico = tecnico; }

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

    public BigDecimal getTotalExtras() { return totalExtras; }
    public void setTotalExtras(BigDecimal totalExtras) { this.totalExtras = totalExtras; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
