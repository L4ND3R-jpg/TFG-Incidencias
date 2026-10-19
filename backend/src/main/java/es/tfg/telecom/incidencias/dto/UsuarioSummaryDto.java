package es.tfg.telecom.incidencias.dto;

import es.tfg.telecom.incidencias.entity.Usuario;

public class UsuarioSummaryDto {
    private Long id;
    private String nombre;
    private String email;
    private String telefono;
    private String rol;

    public UsuarioSummaryDto() {}

    public UsuarioSummaryDto(Usuario usuario) {
        if (usuario != null) {
            this.id = usuario.getId();
            this.nombre = usuario.getNombre();
            this.email = usuario.getEmail();
            this.telefono = usuario.getTelefono();
            this.rol = usuario.getRol().name();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
