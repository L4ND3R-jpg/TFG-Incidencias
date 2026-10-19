package es.tfg.telecom.incidencias.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que intercepta CADA petición HTTP para verificar si contiene
 * un token JWT válido en la cabecera Authorization.
 *
 * Flujo:
 * 1. Extrae la cabecera "Authorization: Bearer <token>"
 * 2. Si existe, extrae el email del token
 * 3. Carga el usuario desde la BBDD
 * 4. Valida el token
 * 5. Si es válido, establece la autenticación en el SecurityContext
 *    para que el resto de filtros de Spring Security lo reconozcan como autenticado
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Si no hay cabecera o no empieza con "Bearer ", dejamos pasar la petición
        // sin autenticar (Spring Security se encargará de rechazarla si es necesario)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            final String userEmail = jwtService.extractUsername(jwt);

            // Solo procesamos si el email es válido y no hay autenticación previa en el contexto
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token inválido o expirado: simplemente no autenticamos.
            // Spring Security rechazará la petición con 401 si el endpoint es protegido.
            logger.debug("Token JWT inválido: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
