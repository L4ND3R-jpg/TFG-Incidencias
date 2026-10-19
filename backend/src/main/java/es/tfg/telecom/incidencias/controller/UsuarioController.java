package es.tfg.telecom.incidencias.controller;

import es.tfg.telecom.incidencias.dto.CrearTecnicoRequest;
import es.tfg.telecom.incidencias.dto.UsuarioSummaryDto;
import es.tfg.telecom.incidencias.entity.Rol;
import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * El GESTOR da de alta un nuevo técnico de campo.
     */
    @PostMapping("/tecnicos")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<UsuarioSummaryDto> crearTecnico(@Valid @RequestBody CrearTecnicoRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Ya existe un usuario registrado con el correo: " + request.getEmail());
        }

        Usuario tecnico = new Usuario();
        tecnico.setNombre(request.getNombre());
        tecnico.setEmail(request.getEmail());
        tecnico.setTelefono(request.getTelefono());
        tecnico.setPassword(passwordEncoder.encode(request.getPassword()));
        tecnico.setRol(Rol.TECNICO);
        tecnico.setActivo(true);

        Usuario guardado = usuarioRepository.save(tecnico);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UsuarioSummaryDto(guardado));
    }
}
