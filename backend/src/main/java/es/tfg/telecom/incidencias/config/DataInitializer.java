package es.tfg.telecom.incidencias.config;

import es.tfg.telecom.incidencias.entity.AsignacionSemanal;
import es.tfg.telecom.incidencias.entity.Rol;
import es.tfg.telecom.incidencias.entity.TipoAsignacion;
import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.AsignacionSemanalRepository;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.IsoFields;

/**
 * Inicializador que asegura las cuentas corporativas base (Gestor y Técnicos).
 * Las incidencias y cuentas de clientes se gestionan manualmente desde la interfaz.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AsignacionSemanalRepository asignacionSemanalRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           AsignacionSemanalRepository asignacionSemanalRepository,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.asignacionSemanalRepository = asignacionSemanalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Gestor
        Usuario gestor = crearUsuarioSiNoExiste(
                "gestor@telecom.es",
                "gestor123",
                "María García (Gestora)",
                "600100100",
                Rol.GESTOR
        );

        // 2. Técnico 1
        Usuario tecnico1 = crearUsuarioSiNoExiste(
                "tecnico1@telecom.es",
                "tecnico123",
                "Carlos Ruiz (Técnico Averías)",
                "600200200",
                Rol.TECNICO
        );

        // 3. Técnico 2
        Usuario tecnico2 = crearUsuarioSiNoExiste(
                "tecnico2@telecom.es",
                "tecnico123",
                "Ana López (Técnica Fibra)",
                "600300300",
                Rol.TECNICO
        );

        // Turnos semanales base para rotación en curso
        LocalDate hoy = LocalDate.now();
        int anioActual = hoy.get(IsoFields.WEEK_BASED_YEAR);
        int semanaActual = hoy.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        crearAsignacionSiNoExiste(tecnico1, anioActual, semanaActual, TipoAsignacion.AVERIAS);
        crearAsignacionSiNoExiste(tecnico2, anioActual, semanaActual, TipoAsignacion.FIBRA);

        LocalDate semanaSiguienteFecha = hoy.plusWeeks(1);
        int siguienteSemana = semanaSiguienteFecha.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int anioSiguiente = semanaSiguienteFecha.get(IsoFields.WEEK_BASED_YEAR);
        crearAsignacionSiNoExiste(tecnico1, anioSiguiente, siguienteSemana, TipoAsignacion.FIBRA);
        crearAsignacionSiNoExiste(tecnico2, anioSiguiente, siguienteSemana, TipoAsignacion.AVERIAS);

        System.out.println("===========================================");
        System.out.println("  CUENTAS OFICIALES LISTAS");
        System.out.println("===========================================");
        System.out.println("  GESTOR:     gestor@telecom.es / gestor123");
        System.out.println("  TECNICO 1:  tecnico1@telecom.es / tecnico123");
        System.out.println("  TECNICO 2:  tecnico2@telecom.es / tecnico123");
        System.out.println("===========================================");
    }

    private Usuario crearUsuarioSiNoExiste(String email, String password,
                                          String nombre, String telefono, Rol rol) {
        return usuarioRepository.findByEmail(email).orElseGet(() -> {
            Usuario u = new Usuario();
            u.setEmail(email);
            u.setPassword(passwordEncoder.encode(password));
            u.setNombre(nombre);
            u.setTelefono(telefono);
            u.setRol(rol);
            u.setActivo(true);
            return usuarioRepository.save(u);
        });
    }

    private void crearAsignacionSiNoExiste(Usuario tecnico, int anio, int semana, TipoAsignacion tipo) {
        if (tecnico == null) return;
        boolean existe = asignacionSemanalRepository
                .findByTecnicoIdAndAnioAndSemana(tecnico.getId(), anio, semana).isPresent();
        if (!existe) {
            AsignacionSemanal asig = new AsignacionSemanal();
            asig.setTecnico(tecnico);
            asig.setAnio(anio);
            asig.setSemana(semana);
            asig.setTipoAsignado(tipo);
            asignacionSemanalRepository.save(asig);
        }
    }
}
