package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.ExtraCobrable;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ExtraCobrableDto {

    private Long id;

    @NotBlank(message = "El concepto del extra cobrable es obligatorio")
    private String concepto;

    @NotNull(message = "El importe es obligatorio")
    @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
    private BigDecimal importe;

    public ExtraCobrableDto() {}

    public ExtraCobrableDto(String concepto, BigDecimal importe) {
        this.concepto = concepto;
        this.importe = importe;
    }

    public ExtraCobrableDto(ExtraCobrable extra) {
        if (extra != null) {
            this.id = extra.getId();
            this.concepto = extra.getConcepto();
            this.importe = extra.getImporte();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }
}
