package es.tfg.telecom.incidencias.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "extras_cobrables")
public class ExtraCobrable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parte_trabajo_id", nullable = false)
    @JsonIgnore
    private ParteTrabajo parteTrabajo;

    @Column(nullable = false, length = 150)
    private String concepto;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal importe;

    public ExtraCobrable() {}

    public ExtraCobrable(String concepto, BigDecimal importe) {
        this.concepto = concepto;
        this.importe = importe;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ParteTrabajo getParteTrabajo() { return parteTrabajo; }
    public void setParteTrabajo(ParteTrabajo parteTrabajo) { this.parteTrabajo = parteTrabajo; }

    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }
}
