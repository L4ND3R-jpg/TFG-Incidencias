package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.AsignacionSemanalRequest;
import es.tfg.telecom.incidencias.dto.AsignacionSemanalResponse;
import es.tfg.telecom.incidencias.dto.UsuarioSummaryDto;
import es.tfg.telecom.incidencias.service.AsignacionSemanalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/asignaciones-semanales")
@PreAuthorize("hasRole('GESTOR')") // Solo el GESTOR puede gestionar los turnos semanales
public class AsignacionSemanalController {

    private final AsignacionSemanalService asignacionSemanalService;

    public AsignacionSemanalController(AsignacionSemanalService asignacionSemanalService) {
        this.asignacionSemanalService = asignacionSemanalService;
    }

    /**
     * Consultar las asignaciones de una semana y año.
     * Ejemplo: GET /api/asignaciones-semanales?anio=2026&semana=42
     */
    @GetMapping
    public ResponseEntity<List<AsignacionSemanalResponse>> listar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer semana) {
        List<AsignacionSemanalResponse> lista = asignacionSemanalService.obtenerAsignaciones(anio, semana);
        return ResponseEntity.ok(lista);
    }

    /**
     * Guardar o actualizar la asignación semanal de un técnico.
     */
    @PostMapping
    public ResponseEntity<AsignacionSemanalResponse> guardar(@Valid @RequestBody AsignacionSemanalRequest request) {
        AsignacionSemanalResponse response = asignacionSemanalService.guardarAsignacion(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtener listado de técnicos activos para el selector del gestor.
     */
    @GetMapping("/tecnicos")
    public ResponseEntity<List<UsuarioSummaryDto>> listarTecnicos() {
        List<UsuarioSummaryDto> tecnicos = asignacionSemanalService.obtenerTecnicosActivos();
        return ResponseEntity.ok(tecnicos);
    }
}
