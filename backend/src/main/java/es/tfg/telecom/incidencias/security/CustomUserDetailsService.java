package es.tfg.telecom.incidencias.security;

import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Servicio que Spring Security invoca automáticamente durante la autenticación
 * para cargar los datos del usuario desde la base de datos.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No se encontró un usuario con el email: " + email));
        return new CustomUserDetails(usuario);
    }
}
