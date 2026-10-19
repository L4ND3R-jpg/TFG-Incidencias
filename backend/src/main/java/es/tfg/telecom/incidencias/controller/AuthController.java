package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.AuthResponse;
import es.tfg.telecom.incidencias.dto.LoginRequest;
import es.tfg.telecom.incidencias.dto.RegisterRequest;
import es.tfg.telecom.incidencias.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para autenticación.
 *
 * Ambos endpoints son públicos (ver SecurityConfig).
 * Nota: el context-path es /api, así que las rutas reales son:
 *   POST /api/auth/register
 *   POST /api/auth/login
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registra un nuevo cliente. Devuelve el token JWT para
     * autenticación inmediata sin necesidad de un segundo login.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Autentica cualquier usuario (cliente, gestor o técnico).
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
