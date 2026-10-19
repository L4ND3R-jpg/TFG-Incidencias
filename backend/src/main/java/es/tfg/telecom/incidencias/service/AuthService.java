package es.tfg.telecom.incidencias.service;

import es.tfg.telecom.incidencias.dto.AuthResponse;
import es.tfg.telecom.incidencias.dto.LoginRequest;
import es.tfg.telecom.incidencias.dto.RegisterRequest;
import es.tfg.telecom.incidencias.entity.Rol;
import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import es.tfg.telecom.incidencias.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de autenticación que encapsula la lógica de registro y login.
 *
 * Decisiones de diseño:
 * - El registro público solo permite crear usuarios con rol CLIENTE.
 *   Los técnicos y gestores se crean internamente.
 * - Tras el registro, se genera el token JWT inmediatamente para que el
 *   cliente quede autenticado sin tener que hacer un segundo login.
 */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Registra un nuevo cliente en el sistema.
     */
    public AuthResponse register(RegisterRequest request) {
        // Verificar que el email no esté ya registrado
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Ya existe un usuario registrado con el email: " + request.getEmail());
        }

        // Crear el usuario con rol CLIENTE
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setTelefono(request.getTelefono());
        usuario.setRol(Rol.CLIENTE);
        usuario.setActivo(true);

        usuario = usuarioRepository.save(usuario);

        // Generar token JWT para autenticación inmediata tras registro
        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        String jwtToken = jwtService.generateToken(userDetails);

        return new AuthResponse(
                jwtToken,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRol().name()
        );
    }

    /**
     * Autentica un usuario existente (cualquier rol).
     */
    public AuthResponse login(LoginRequest request) {
        // AuthenticationManager delega en CustomUserDetailsService + BCrypt
        // Si las credenciales son incorrectas, lanza BadCredentialsException
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Si llegamos aquí, las credenciales son correctas
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        String jwtToken = jwtService.generateToken(userDetails);

        return new AuthResponse(
                jwtToken,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRol().name()
        );
    }
}
