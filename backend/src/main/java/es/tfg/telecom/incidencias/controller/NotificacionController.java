package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.NotificacionResponse;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import es.tfg.telecom.incidencias.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    /**
     * Listar notificaciones del usuario autenticado (todas o solo las no leídas).
     */
    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listar(
            @RequestParam(required = false, defaultValue = "false") boolean soloNoLeidas,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<NotificacionResponse> lista = soloNoLeidas
                ? notificacionService.listarNoLeidas(userDetails.getId())
                : notificacionService.listarNotificacionesUsuario(userDetails.getId());
        return ResponseEntity.ok(lista);
    }

    /**
     * Contar notificaciones no leídas del usuario autenticado.
     */
    @GetMapping("/no-leidas/count")
    public ResponseEntity<Map<String, Long>> contarNoLeidas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificacionService.contarNoLeidas(userDetails.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Marcar una notificación como leída (valida que pertenezca al usuario autenticado).
     */
    @PatchMapping("/{id}/leida")
    public ResponseEntity<Map<String, String>> marcarComoLeida(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificacionService.marcarComoLeida(id, userDetails.getId());
        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    /**
     * Marcar todas las notificaciones del usuario autenticado como leídas.
     */
    @PatchMapping("/leer-todas")
    public ResponseEntity<Map<String, String>> marcarTodasComoLeidas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificacionService.marcarTodasComoLeidas(userDetails.getId());
        return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones han sido marcadas como leídas"));
    }
}
