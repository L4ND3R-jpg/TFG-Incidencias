package es.tfg.telecom.incidencias.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para la API REST.
 *
 * Centraliza la gestión de errores para devolver respuestas JSON
 * consistentes en lugar de trazas de pila o errores de Tomcat genéricos.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Errores de validación de Bean Validation (@Valid).
     * Devuelve un mapa campo → mensaje de error.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Error de validación");
        body.put("campos", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Credenciales incorrectas al hacer login.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Credenciales incorrectas");
        body.put("mensaje", "El email o la contraseña no son correctos");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    /**
     * Usuario deshabilitado (activo = false).
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(DisabledException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Cuenta deshabilitada");
        body.put("mensaje", "Tu cuenta ha sido deshabilitada. Contacta con el administrador.");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Excepciones de negocio genéricas (email duplicado, etc.).
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Error de negocio");
        body.put("mensaje", ex.getMessage());

        return ResponseEntity.badRequest().body(body);
    }
}
