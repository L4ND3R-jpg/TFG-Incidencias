package es.tfg.telecom.incidencias.dto;

/**
 * DTO de respuesta tras un login o registro exitoso.
 * Devuelve el token JWT y los datos básicos del usuario para que el frontend
 * pueda almacenarlos en memoria/localStorage sin decodificar el JWT.
 */
public class AuthResponse {

    private String token;
    private Long id;
    private String email;
    private String nombre;
    private String rol;

    public AuthResponse() {}

    public AuthResponse(String token, Long id, String email, String nombre, String rol) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.nombre = nombre;
        this.rol = rol;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
