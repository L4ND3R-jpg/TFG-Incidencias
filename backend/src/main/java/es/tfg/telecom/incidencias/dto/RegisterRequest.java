package es.tfg.telecom.incidencias.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para la petición de registro de un nuevo cliente.
 * Solo los clientes se registran a sí mismos; los técnicos y el gestor
 * se crean internamente (DataInitializer o futuro panel de admin).
 */
public class RegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String nombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
    private String password;

    @Size(max = 20, message = "El teléfono no puede superar los 20 caracteres")
    private String telefono;

    public RegisterRequest() {}

    public RegisterRequest(String nombre, String email, String password, String telefono) {
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.telefono = telefono;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
}
