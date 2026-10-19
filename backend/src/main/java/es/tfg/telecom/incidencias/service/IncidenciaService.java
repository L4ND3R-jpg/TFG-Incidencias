package es.tfg.telecom.incidencias.service;

import es.tfg.telecom.incidencias.dto.CrearIncidenciaRequest;
import es.tfg.telecom.incidencias.dto.IncidenciaResponse;
import es.tfg.telecom.incidencias.dto.ReprogramarIncidenciaRequest;
import es.tfg.telecom.incidencias.entity.*;
import es.tfg.telecom.incidencias.repository.AvisoClienteRepository;
import es.tfg.telecom.incidencias.repository.IncidenciaRepository;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncidenciaService {

    private final IncidenciaRepository incidenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignacionSemanalService asignacionSemanalService;
    private final NotificacionService notificacionService;
    private final AvisoClienteRepository avisoClienteRepository;

    public IncidenciaService(IncidenciaRepository incidenciaRepository,
                             UsuarioRepository usuarioRepository,
                             AsignacionSemanalService asignacionSemanalService,
                             NotificacionService notificacionService,
                             AvisoClienteRepository avisoClienteRepository) {
        this.incidenciaRepository = incidenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignacionSemanalService = asignacionSemanalService;
        this.notificacionService = notificacionService;
        this.avisoClienteRepository = avisoClienteRepository;
    }

    /**
     * El CLIENTE crea una nueva incidencia.
     * Se aplican las validaciones de tipo (Avería vs Fibra) y la asignación automática por rotación semanal.
     */
    @Transactional
    public IncidenciaResponse crearIncidencia(CrearIncidenciaRequest request, Long clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + clienteId));

        Incidencia inc = new Incidencia();
        inc.setCliente(cliente);
        inc.setTipo(request.getTipo());
        inc.setDireccion(request.getDireccion());
        inc.setTelefonoContacto(request.getTelefonoContacto());
        inc.setDescripcion(request.getDescripcion());
        inc.setFechaCita(request.getFechaCita());

        if (request.getFechaCita() != null && request.getFechaCita().isBefore(LocalDate.now())) {
            throw new RuntimeException("La fecha de la cita no puede ser anterior a hoy");
        }
        if (request.getTelefonoContacto() != null && !request.getTelefonoContacto().matches("^[0-9]{9,15}$")) {
            throw new RuntimeException("El teléfono de contacto debe contener solo dígitos (entre 9 y 15)");
        }

        // Validaciones según el tipo de incidencia
        if (request.getTipo() == TipoIncidencia.AVERIA) {
            if (request.getFranja() == null) {
                throw new RuntimeException("Para averías es obligatorio seleccionar una franja horaria (MANANA o TARDE)");
            }
            inc.setFranja(request.getFranja());
            inc.setHoraInicioEstimada(null);
            inc.setHoraFinEstimada(null);
            inc.setDuracionEstimadaMinutos(null);
        } else if (request.getTipo() == TipoIncidencia.FIBRA) {
            if (request.getHoraInicioEstimada() == null) {
                throw new RuntimeException("Para instalaciones de fibra es obligatorio indicar la hora de inicio");
            }
            if (request.getDuracionEstimadaMinutos() == null) {
                throw new RuntimeException("Para instalaciones de fibra es obligatoria la duración estimada");
            }
            inc.setFranja(null);
            inc.setHoraInicioEstimada(request.getHoraInicioEstimada());
            inc.setDuracionEstimadaMinutos(request.getDuracionEstimadaMinutos());
            inc.setHoraFinEstimada(request.getHoraInicioEstimada().plusMinutes(request.getDuracionEstimadaMinutos()));
        }

        // Asignación automática por rotación semanal
        asignarTecnicoAutomaticamente(inc);

        inc = incidenciaRepository.save(inc);

        // Notificaciones posteriores al guardado
        if (inc.getTecnico() != null) {
            notificacionService.crearNotificacion(
                    inc.getTecnico(),
                    "Nueva incidencia asignada #" + inc.getId(),
                    "Tienes asignada una intervención de " + inc.getTipo() + " para el " + inc.getFechaCita() + " en " + inc.getDireccion(),
                    inc.getId()
            );
        } else {
            // Notificar a los gestores que hay una incidencia pendiente sin técnico asignado
            List<Usuario> gestores = usuarioRepository.findByRolAndActivoTrue(Rol.GESTOR);
            for (Usuario gestor : gestores) {
                notificacionService.crearNotificacion(
                        gestor,
                        "Incidencia #" + inc.getId() + " pendiente de asignación",
                        "No se encontró técnico disponible para la semana de la cita (" + inc.getFechaCita() + ") de tipo " + inc.getTipo(),
                        inc.getId()
                );
            }
        }

        return new IncidenciaResponse(inc);
    }

    /**
     * Algoritmo de asignación automática:
     * 1. Obtiene la semana y año de la fecha de la cita.
     * 2. Busca qué técnicos tienen asignado ese tipo de trabajo (AVERIAS o FIBRA) esa semana.
     * 3. Si hay varios, asigna al que tenga menor carga de trabajo en esa fecha.
     */
    private void asignarTecnicoAutomaticamente(Incidencia inc) {
        LocalDate fecha = inc.getFechaCita();
        int anio = fecha.get(IsoFields.WEEK_BASED_YEAR);
        int semana = fecha.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        TipoAsignacion tipoBuscado = (inc.getTipo() == TipoIncidencia.AVERIA)
                ? TipoAsignacion.AVERIAS
                : TipoAsignacion.FIBRA;

        List<Usuario> tecnicosDisponibles = asignacionSemanalService
                .obtenerTecnicosParaTipoYSemana(tipoBuscado, anio, semana);

        if (tecnicosDisponibles.isEmpty()) {
            inc.setTecnico(null);
            inc.setEstado(EstadoIncidencia.PENDIENTE);
            return;
        }

        // Balanceo de carga: seleccionar el técnico con menos intervenciones activas ese día
        Usuario mejorTecnico = tecnicosDisponibles.stream()
                .min(Comparator.comparingLong(t ->
                        incidenciaRepository.countByTecnicoIdAndFechaCitaAndEstadoNot(t.getId(), fecha, EstadoIncidencia.RESUELTA)
                ))
                .orElse(tecnicosDisponibles.get(0));

        inc.setTecnico(mejorTecnico);
        inc.setEstado(EstadoIncidencia.ASIGNADA);
    }

    /**
     * Listado filtrado según el rol del usuario autenticado.
     */
    public List<IncidenciaResponse> listarParaUsuario(CustomUserDetails userDetails) {
        Usuario usuario = userDetails.getUsuario();

        List<Incidencia> lista;
        if (usuario.getRol() == Rol.GESTOR) {
            lista = incidenciaRepository.findAllByOrderByCreatedAtDesc();
        } else if (usuario.getRol() == Rol.CLIENTE) {
            lista = incidenciaRepository.findByClienteIdOrderByCreatedAtDesc(usuario.getId());
        } else {
            // TECNICO: todas las asignadas a él
            lista = incidenciaRepository.findByTecnicoIdOrderByFechaCitaAsc(usuario.getId());
        }

        return lista.stream().map(IncidenciaResponse::new).collect(Collectors.toList());
    }

    /**
     * Vista de agenda diaria del técnico: incidencias de hoy (o fecha especificada).
     */
    public List<IncidenciaResponse> listarDelDiaParaTecnico(Long tecnicoId, LocalDate fecha) {
        if (fecha == null) fecha = LocalDate.now();
        return incidenciaRepository.findByTecnicoIdAndFechaCita(tecnicoId, fecha)
                .stream()
                .map(IncidenciaResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Obtener detalle de una incidencia con verificación de permisos por rol.
     */
    public IncidenciaResponse obtenerPorId(Long id, CustomUserDetails userDetails) {
        Incidencia inc = incidenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + id));

        Usuario usuario = userDetails.getUsuario();
        if (usuario.getRol() == Rol.CLIENTE && !inc.getCliente().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permiso para ver esta incidencia");
        }
        if (usuario.getRol() == Rol.TECNICO && (inc.getTecnico() == null || !inc.getTecnico().getId().equals(usuario.getId()))) {
            throw new RuntimeException("No tienes permiso para ver esta incidencia");
        }

        return new IncidenciaResponse(inc);
    }

    /**
     * El GESTOR reasigna a mano la incidencia a otro técnico.
     */
    @Transactional
    public IncidenciaResponse reasignar(Long incidenciaId, Long nuevoTecnicoId) {
        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        Usuario tecnico = usuarioRepository.findById(nuevoTecnicoId)
                .orElseThrow(() -> new RuntimeException("Técnico no encontrado con ID: " + nuevoTecnicoId));

        if (tecnico.getRol() != Rol.TECNICO) {
            throw new RuntimeException("El usuario seleccionado no tiene rol TECNICO");
        }

        inc.setTecnico(tecnico);
        if (inc.getEstado() == EstadoIncidencia.PENDIENTE) {
            inc.setEstado(EstadoIncidencia.ASIGNADA);
        }

        inc = incidenciaRepository.save(inc);

        notificacionService.crearNotificacion(
                tecnico,
                "Incidencia #" + inc.getId() + " reasignada a ti",
                "El gestor te ha asignado la intervención de " + inc.getTipo() + " para el " + inc.getFechaCita(),
                inc.getId()
        );

        return new IncidenciaResponse(inc);
    }

    /**
     * Transición de estados de la incidencia con validación de máquina de estados.
     */
    @Transactional
    public IncidenciaResponse cambiarEstado(Long incidenciaId, EstadoIncidencia nuevoEstado, CustomUserDetails userDetails) {
        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        EstadoIncidencia actual = inc.getEstado();

        // Validar transiciones de estado permitidas
        validarTransicionEstado(actual, nuevoEstado);

        // Validar permisos del técnico
        if (userDetails.getUsuario().getRol() == Rol.TECNICO) {
            if (inc.getTecnico() == null || !inc.getTecnico().getId().equals(userDetails.getId())) {
                throw new RuntimeException("Solo puedes cambiar el estado de incidencias asignadas a ti");
            }
        }

        inc.setEstado(nuevoEstado);
        inc = incidenciaRepository.save(inc);

        // Reglas de negocio al pasar a STAND_BY:
        // 1. Avisar al Gestor de que el técnico tiene hueco libre.
        // 2. Avisar al Cliente para que pueda reprogramar la cita.
        if (nuevoEstado == EstadoIncidencia.STAND_BY) {
            List<Usuario> gestores = usuarioRepository.findByRolAndActivoTrue(Rol.GESTOR);
            String nombreTecnico = inc.getTecnico() != null ? inc.getTecnico().getNombre() : "Técnico";
            for (Usuario gestor : gestores) {
                notificacionService.crearNotificacion(
                        gestor,
                        "Técnico disponible (STAND BY)",
                        nombreTecnico + " ha puesto la incidencia #" + inc.getId() + " en STAND BY y tiene trabajo libre.",
                        inc.getId()
                );
            }

            // Notificación y correo al cliente
            notificacionService.crearNotificacion(
                    inc.getCliente(),
                    "Incidencia #" + inc.getId() + " en STAND BY",
                    "El técnico no pudo contactar contigo. Tu incidencia está en pausa. Por favor, accede para reprogramar tu cita.",
                    inc.getId()
            );

            notificacionService.enviarEmail(
                    inc.getCliente().getEmail(),
                    "Aviso de Incidencia en STAND BY #" + inc.getId(),
                    "Estimado/a " + inc.getCliente().getNombre() + ",\n\n" +
                    "El técnico ha intentado contactar con usted para la cita del " + inc.getFechaCita() + " sin éxito.\n" +
                    "La incidencia se encuentra en STAND BY. Por favor, inicie sesión en la plataforma para elegir una nueva cita.\n\n" +
                    "Atentamente,\nServicio Técnico"
            );
        }

        return new IncidenciaResponse(inc);
    }

    private void validarTransicionEstado(EstadoIncidencia actual, EstadoIncidencia nuevo) {
        if (actual == nuevo) return;

        if (actual == EstadoIncidencia.RESUELTA) {
            throw new RuntimeException("Una incidencia en estado RESUELTA no puede cambiar de estado.");
        }

        switch (actual) {
            case PENDIENTE:
                if (nuevo != EstadoIncidencia.ASIGNADA) {
                    throw new RuntimeException("Una incidencia PENDIENTE solo puede pasar a ASIGNADA.");
                }
                break;
            case ASIGNADA:
                if (nuevo != EstadoIncidencia.EN_CURSO && nuevo != EstadoIncidencia.STAND_BY && nuevo != EstadoIncidencia.RESUELTA) {
                    throw new RuntimeException("Transición inválida desde ASIGNADA a " + nuevo);
                }
                break;
            case EN_CURSO:
                if (nuevo != EstadoIncidencia.STAND_BY && nuevo != EstadoIncidencia.RESUELTA) {
                    throw new RuntimeException("Transición inválida desde EN_CURSO a " + nuevo);
                }
                break;
            case STAND_BY:
                if (nuevo != EstadoIncidencia.ASIGNADA && nuevo != EstadoIncidencia.EN_CURSO && nuevo != EstadoIncidencia.RESUELTA) {
                    throw new RuntimeException("Transición inválida desde STAND_BY a " + nuevo);
                }
                break;
        }
    }

    /**
     * El TÉCNICO envía un aviso al cliente (notificación web + correo) con intervalo mínimo de 5 minutos.
     */
    @Transactional
    public IncidenciaResponse avisarCliente(Long incidenciaId, CustomUserDetails userDetails) {
        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        if (inc.getTecnico() == null || !inc.getTecnico().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Solo puedes avisar al cliente de incidencias asignadas a ti");
        }

        if (inc.getEstado() != EstadoIncidencia.ASIGNADA && inc.getEstado() != EstadoIncidencia.EN_CURSO) {
            throw new RuntimeException("Solo se puede avisar al cliente si la incidencia está en estado ASIGNADA o EN_CURSO (estado actual: " + inc.getEstado() + ")");
        }

        if (inc.getUltimoAvisoAt() != null) {
            long segundosTranscurridos = Duration.between(inc.getUltimoAvisoAt(), LocalDateTime.now()).getSeconds();
            if (segundosTranscurridos < 300) {
                long segundosRestantes = 300 - segundosTranscurridos;
                throw new RuntimeException("Debes esperar " + segundosRestantes + " segundos antes de poder enviar otro aviso al cliente.");
            }
        }

        LocalDateTime ahora = LocalDateTime.now();
        inc.setUltimoAvisoAt(ahora);
        inc = incidenciaRepository.save(inc);

        AvisoCliente aviso = new AvisoCliente(inc, inc.getTecnico(), "EMAIL_Y_WEB");
        avisoClienteRepository.save(aviso);

        notificacionService.crearNotificacion(
                inc.getCliente(),
                "Aviso del técnico - Incidencia #" + inc.getId(),
                "El técnico " + inc.getTecnico().getNombre() + " te ha enviado un aviso respecto a tu cita en " + inc.getDireccion() + ". Por favor, permanece atento.",
                inc.getId()
        );

        notificacionService.enviarEmail(
                inc.getCliente().getEmail(),
                "Aviso de visita técnica - Incidencia #" + inc.getId(),
                "Estimado/a " + inc.getCliente().getNombre() + ",\n\n" +
                "El técnico " + inc.getTecnico().getNombre() + " se encuentra atendiendo su incidencia de " + inc.getTipo() + " y está intentando contactar con usted o se encuentra en la dirección acordada.\n\n" +
                "Dirección: " + inc.getDireccion() + "\n" +
                "Fecha de la cita: " + inc.getFechaCita() + "\n\n" +
                "Por favor, asegúrese de estar disponible o llame al teléfono de la operadora si tiene cualquier inconveniente.\n\n" +
                "Atentamente,\nServicio Técnico"
        );

        return new IncidenciaResponse(inc);
    }

    /**
     * Obtiene los huecos de inicio libres cada 30 min para una cita de FIBRA en STAND_BY.
     */
    public List<LocalTime> obtenerHuecosLibres(Long incidenciaId, LocalDate fecha, CustomUserDetails userDetails) {
        if (fecha == null) {
            throw new RuntimeException("El parámetro fecha es obligatorio");
        }
        if (fecha.isBefore(LocalDate.now())) {
            throw new RuntimeException("La fecha debe ser igual o posterior a hoy");
        }

        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        if (!inc.getCliente().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Solo el cliente dueño puede consultar huecos libres para reprogramar");
        }

        if (inc.getTipo() != TipoIncidencia.FIBRA) {
            throw new RuntimeException("Solo las incidencias de tipo FIBRA disponen de selección de huecos horarios");
        }

        if (inc.getEstado() != EstadoIncidencia.STAND_BY) {
            throw new RuntimeException("Solo se pueden consultar huecos libres para incidencias en estado STAND_BY");
        }

        int anio = fecha.get(IsoFields.WEEK_BASED_YEAR);
        int semana = fecha.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        List<Usuario> tecnicos = asignacionSemanalService.obtenerTecnicosParaTipoYSemana(TipoAsignacion.FIBRA, anio, semana);
        Usuario tecnico = null;
        if (!tecnicos.isEmpty()) {
            tecnico = tecnicos.stream()
                    .min(Comparator.comparingLong(t ->
                            incidenciaRepository.countByTecnicoIdAndFechaCitaAndEstadoNot(t.getId(), fecha, EstadoIncidencia.RESUELTA)
                    ))
                    .orElse(tecnicos.get(0));
        } else if (inc.getTecnico() != null) {
            tecnico = inc.getTecnico();
        }

        if (tecnico == null) {
            return new ArrayList<>();
        }

        List<Incidencia> citasActivas = incidenciaRepository.findByTecnicoIdAndFechaCita(tecnico.getId(), fecha)
                .stream()
                .filter(c -> c.getEstado() != EstadoIncidencia.RESUELTA && c.getEstado() != EstadoIncidencia.STAND_BY)
                .filter(c -> !c.getId().equals(inc.getId()))
                .collect(Collectors.toList());

        int duracion = inc.getDuracionEstimadaMinutos() != null ? inc.getDuracionEstimadaMinutos() : 60;
        List<LocalTime> huecosLibres = new ArrayList<>();

        // Franja de mañana: 09:00 a 14:00
        LocalTime actual = LocalTime.of(9, 0);
        LocalTime finManana = LocalTime.of(14, 0);
        while (!actual.plusMinutes(duracion).isAfter(finManana)) {
            LocalTime finSlot = actual.plusMinutes(duracion);
            if (!haySolapamiento(actual, finSlot, citasActivas)) {
                huecosLibres.add(actual);
            }
            actual = actual.plusMinutes(30);
        }

        // Franja de tarde: 16:00 a 20:00
        actual = LocalTime.of(16, 0);
        LocalTime finTarde = LocalTime.of(20, 0);
        while (!actual.plusMinutes(duracion).isAfter(finTarde)) {
            LocalTime finSlot = actual.plusMinutes(duracion);
            if (!haySolapamiento(actual, finSlot, citasActivas)) {
                huecosLibres.add(actual);
            }
            actual = actual.plusMinutes(30);
        }

        return huecosLibres;
    }

    private boolean haySolapamiento(LocalTime inicioSlot, LocalTime finSlot, List<Incidencia> citas) {
        for (Incidencia c : citas) {
            if (c.getHoraInicioEstimada() != null && c.getHoraFinEstimada() != null) {
                if (inicioSlot.isBefore(c.getHoraFinEstimada()) && finSlot.isAfter(c.getHoraInicioEstimada())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * El CLIENTE reprograma una incidencia en STAND_BY.
     */
    @Transactional
    public IncidenciaResponse reprogramarIncidencia(Long incidenciaId, ReprogramarIncidenciaRequest request, CustomUserDetails userDetails) {
        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        final Long currentId = inc.getId();

        if (!inc.getCliente().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Solo el cliente dueño puede reprogramar esta incidencia");
        }

        if (inc.getEstado() != EstadoIncidencia.STAND_BY) {
            throw new RuntimeException("Solo se pueden reprogramar incidencias en estado STAND_BY (estado actual: " + inc.getEstado() + ")");
        }

        if (request.getFechaCita() == null || !request.getFechaCita().isAfter(LocalDate.now())) {
            throw new RuntimeException("La fecha de reprogramación debe ser futura");
        }

        inc.setFechaCita(request.getFechaCita());

        if (inc.getTipo() == TipoIncidencia.AVERIA) {
            if (request.getFranja() == null) {
                throw new RuntimeException("Para averías es obligatorio seleccionar una franja horaria (MANANA o TARDE)");
            }
            inc.setFranja(request.getFranja());
            inc.setHoraInicioEstimada(null);
            inc.setHoraFinEstimada(null);
        } else if (inc.getTipo() == TipoIncidencia.FIBRA) {
            if (request.getHoraInicioEstimada() == null) {
                throw new RuntimeException("Para instalaciones de fibra es obligatoria la hora de inicio");
            }
            LocalTime inicio = request.getHoraInicioEstimada();
            int duracion = inc.getDuracionEstimadaMinutos() != null ? inc.getDuracionEstimadaMinutos() : 60;
            LocalTime fin = inicio.plusMinutes(duracion);

            boolean enManana = !inicio.isBefore(LocalTime.of(9, 0)) && !fin.isAfter(LocalTime.of(14, 0));
            boolean enTarde = !inicio.isBefore(LocalTime.of(16, 0)) && !fin.isAfter(LocalTime.of(20, 0));
            if (!enManana && !enTarde) {
                throw new RuntimeException("El horario seleccionado debe estar comprendido entre las 09:00-14:00 o 16:00-20:00");
            }

            int anio = request.getFechaCita().get(IsoFields.WEEK_BASED_YEAR);
            int semana = request.getFechaCita().get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            List<Usuario> tecnicos = asignacionSemanalService.obtenerTecnicosParaTipoYSemana(TipoAsignacion.FIBRA, anio, semana);
            if (!tecnicos.isEmpty()) {
                Usuario tecnico = tecnicos.stream()
                        .min(Comparator.comparingLong(t ->
                                incidenciaRepository.countByTecnicoIdAndFechaCitaAndEstadoNot(t.getId(), request.getFechaCita(), EstadoIncidencia.RESUELTA)
                        ))
                        .orElse(tecnicos.get(0));

                List<Incidencia> citas = incidenciaRepository.findByTecnicoIdAndFechaCita(tecnico.getId(), request.getFechaCita())
                        .stream()
                        .filter(c -> c.getEstado() != EstadoIncidencia.RESUELTA && c.getEstado() != EstadoIncidencia.STAND_BY)
                        .filter(c -> !c.getId().equals(currentId))
                        .collect(Collectors.toList());

                if (haySolapamiento(inicio, fin, citas)) {
                    throw new RuntimeException("El hueco seleccionado se solapa con otra cita del técnico");
                }
            }

            inc.setHoraInicioEstimada(inicio);
            inc.setHoraFinEstimada(fin);
            inc.setFranja(null);
        }

        // Recalcular técnico según la semana de la nueva fecha (reutiliza asignación automática)
        asignarTecnicoAutomaticamente(inc);

        // Poner estado en ASIGNADA
        inc.setEstado(EstadoIncidencia.ASIGNADA);
        inc = incidenciaRepository.save(inc);

        // Notificar al técnico
        if (inc.getTecnico() != null) {
            notificacionService.crearNotificacion(
                    inc.getTecnico(),
                    "Incidencia #" + inc.getId() + " reprogramada",
                    "El cliente ha reprogramado la cita para el " + inc.getFechaCita() + " en " + inc.getDireccion(),
                    inc.getId()
            );
        }

        return new IncidenciaResponse(inc);
    }
}
