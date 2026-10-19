package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.CambiarEstadoRequest;
import es.tfg.telecom.incidencias.dto.CrearIncidenciaRequest;
import es.tfg.telecom.incidencias.dto.IncidenciaResponse;
import es.tfg.telecom.incidencias.dto.ReasignarIncidenciaRequest;
import es.tfg.telecom.incidencias.dto.CrearParteTrabajoRequest;
import es.tfg.telecom.incidencias.dto.ParteTrabajoResponse;
import es.tfg.telecom.incidencias.service.ParteTrabajoService;
import es.tfg.telecom.incidencias.dto.ReprogramarIncidenciaRequest;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import es.tfg.telecom.incidencias.service.IncidenciaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/incidencias")
public class IncidenciaController {

    private final IncidenciaService incidenciaService;
    private final ParteTrabajoService parteTrabajoService;

    public IncidenciaController(IncidenciaService incidenciaService,
                                ParteTrabajoService parteTrabajoService) {
        this.incidenciaService = incidenciaService;
        this.parteTrabajoService = parteTrabajoService;
    }

    /**
     * El CLIENTE crea una nueva incidencia.
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<IncidenciaResponse> crear(
            @Valid @RequestBody CrearIncidenciaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IncidenciaResponse response = incidenciaService.crearIncidencia(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Listado principal: devuelve incidencias según el rol del usuario conectado.
     * - GESTOR: todas las incidencias.
     * - CLIENTE: sus propias incidencias.
     * - TECNICO: todas las asignadas a él.
     */
    @GetMapping
    public ResponseEntity<List<IncidenciaResponse>> listar(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<IncidenciaResponse> lista = incidenciaService.listarParaUsuario(userDetails);
        return ResponseEntity.ok(lista);
    }

    /**
     * Detalle de una incidencia.
     */
    @GetMapping("/{id}")
    public ResponseEntity<IncidenciaResponse> obtenerPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IncidenciaResponse response = incidenciaService.obtenerPorId(id, userDetails);
        return ResponseEntity.ok(response);
    }

    /**
     * Vista diaria del TÉCNICO: solo sus incidencias del día (hoy por defecto).
     */
    @GetMapping("/tecnico/agenda-diaria")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<List<IncidenciaResponse>> listarDelDia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<IncidenciaResponse> lista = incidenciaService.listarDelDiaParaTecnico(userDetails.getId(), fecha);
        return ResponseEntity.ok(lista);
    }

    /**
     * El GESTOR reasigna a mano la incidencia a otro técnico.
     */
    @PatchMapping("/{id}/reasignar")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<IncidenciaResponse> reasignar(
            @PathVariable Long id,
            @Valid @RequestBody ReasignarIncidenciaRequest request) {
        IncidenciaResponse response = incidenciaService.reasignar(id, request.getTecnicoId());
        return ResponseEntity.ok(response);
    }

    /**
     * Cambio de estado de la incidencia (ej. EN_CURSO, STAND_BY, RESUELTA).
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('GESTOR', 'TECNICO')")
    public ResponseEntity<IncidenciaResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IncidenciaResponse response = incidenciaService.cambiarEstado(id, request.getNuevoEstado(), userDetails);
        return ResponseEntity.ok(response);
    }

    /**
     * El TÉCNICO pulsa el botón "Avisar Cliente" (notificación web + correo con cooldown de 5 min).
     */
    @PostMapping("/{id}/avisar-cliente")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<IncidenciaResponse> avisarCliente(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IncidenciaResponse response = incidenciaService.avisarCliente(id, userDetails);
        return ResponseEntity.ok(response);
    }

    /**
     * El TÉCNICO asignado registra el parte de trabajo (pasa la incidencia a RESUELTA).
     */
    @PostMapping("/{id}/parte")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<ParteTrabajoResponse> crearParte(
            @PathVariable Long id,
            @Valid @RequestBody CrearParteTrabajoRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ParteTrabajoResponse response = parteTrabajoService.crearParte(id, request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Consultar el parte de trabajo de una incidencia (GESTOR o TÉCNICO dueño).
     */
    @GetMapping("/{id}/parte")
    @PreAuthorize("hasAnyRole('GESTOR', 'TECNICO')")
    public ResponseEntity<ParteTrabajoResponse> obtenerParte(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ParteTrabajoResponse response = parteTrabajoService.obtenerPorIncidencia(id, userDetails);
        return ResponseEntity.ok(response);
    }

    /**
     * Consulta de huecos de inicio libres cada 30 min (solo CLIENTE dueño, tipo FIBRA en STAND_BY).
     */
    @GetMapping("/{id}/huecos-libres")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<List<LocalTime>> obtenerHuecosLibres(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<LocalTime> huecos = incidenciaService.obtenerHuecosLibres(id, fecha, userDetails);
        return ResponseEntity.ok(huecos);
    }

    /**
     * El CLIENTE reprograma una incidencia en STAND_BY (avería: fecha y franja; fibra: fecha y hora inicio).
     */
    @PatchMapping("/{id}/reprogramar")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<IncidenciaResponse> reprogramar(
            @PathVariable Long id,
            @Valid @RequestBody ReprogramarIncidenciaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IncidenciaResponse response = incidenciaService.reprogramarIncidencia(id, request, userDetails);
        return ResponseEntity.ok(response);
    }
}
