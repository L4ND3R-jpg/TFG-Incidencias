package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.ParteTrabajoResponse;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import es.tfg.telecom.incidencias.service.ParteTrabajoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/partes")
@PreAuthorize("hasAnyRole('GESTOR', 'TECNICO')")
public class ParteTrabajoController {

    private final ParteTrabajoService parteTrabajoService;

    public ParteTrabajoController(ParteTrabajoService parteTrabajoService) {
        this.parteTrabajoService = parteTrabajoService;
    }

    /**
     * Listar partes de trabajo: GESTOR ve todos; TÉCNICO ve los suyos.
     */
    @GetMapping
    public ResponseEntity<List<ParteTrabajoResponse>> listar(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ParteTrabajoResponse> lista = parteTrabajoService.listarPartes(userDetails);
        return ResponseEntity.ok(lista);
    }
}
