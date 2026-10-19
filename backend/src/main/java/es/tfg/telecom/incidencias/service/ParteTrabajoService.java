package es.tfg.telecom.incidencias.service;

import es.tfg.telecom.incidencias.dto.CrearParteTrabajoRequest;
import es.tfg.telecom.incidencias.dto.ExtraCobrableDto;
import es.tfg.telecom.incidencias.dto.ParteTrabajoResponse;
import es.tfg.telecom.incidencias.entity.*;
import es.tfg.telecom.incidencias.repository.IncidenciaRepository;
import es.tfg.telecom.incidencias.repository.ParteTrabajoRepository;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import es.tfg.telecom.incidencias.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParteTrabajoService {

    private final ParteTrabajoRepository parteTrabajoRepository;
    private final IncidenciaRepository incidenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public ParteTrabajoService(ParteTrabajoRepository parteTrabajoRepository,
                               IncidenciaRepository incidenciaRepository,
                               UsuarioRepository usuarioRepository,
                               NotificacionService notificacionService) {
        this.parteTrabajoRepository = parteTrabajoRepository;
        this.incidenciaRepository = incidenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    /**
     * El TÉCNICO asignado crea el parte de trabajo al finalizar. La incidencia pasa a RESUELTA.
     */
    @Transactional
    public ParteTrabajoResponse crearParte(Long incidenciaId, CrearParteTrabajoRequest request, CustomUserDetails userDetails) {
        Incidencia inc = incidenciaRepository.findById(incidenciaId)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con ID: " + incidenciaId));

        // Solo el técnico dueño
        if (inc.getTecnico() == null || !inc.getTecnico().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Solo el técnico asignado a la incidencia puede crear el parte de trabajo");
        }

        // No debe existir ya un parte
        if (parteTrabajoRepository.existsByIncidenciaId(incidenciaId)) {
            throw new RuntimeException("Ya existe un parte de trabajo registrado para la incidencia #" + incidenciaId);
        }

        // Valida que horaFin sea posterior a horaInicio
        if (!request.getHoraFinReal().isAfter(request.getHoraInicioReal())) {
            throw new RuntimeException("La hora de fin real (" + request.getHoraFinReal() + ") debe ser posterior a la hora de inicio real (" + request.getHoraInicioReal() + ")");
        }

        ParteTrabajo parte = new ParteTrabajo();
        parte.setIncidencia(inc);
        parte.setTecnico(inc.getTecnico());
        parte.setFecha(request.getFecha());
        parte.setHoraInicioReal(request.getHoraInicioReal());
        parte.setHoraFinReal(request.getHoraFinReal());
        parte.setDescripcionRealizado(request.getDescripcionRealizado());

        // Validar extras y agregarlos
        if (request.getExtras() != null) {
            for (ExtraCobrableDto extraDto : request.getExtras()) {
                if (extraDto.getImporte() == null || extraDto.getImporte().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new RuntimeException("Cada importe de los extras cobrables debe ser mayor que 0");
                }
                ExtraCobrable extra = new ExtraCobrable(extraDto.getConcepto(), extraDto.getImporte());
                parte.addExtra(extra);
            }
        }

        // Al guardarlo, la incidencia pasa a RESUELTA
        inc.setEstado(EstadoIncidencia.RESUELTA);
        incidenciaRepository.save(inc);

        parte = parteTrabajoRepository.save(parte);

        // Notificación al cliente de resolución
        notificacionService.crearNotificacion(
                inc.getCliente(),
                "Incidencia #" + inc.getId() + " RESUELTA",
                "El técnico " + inc.getTecnico().getNombre() + " ha completado la intervención y registrado el parte de trabajo.",
                inc.getId()
        );

        // Notificación a los gestores
        List<Usuario> gestores = usuarioRepository.findByRolAndActivoTrue(Rol.GESTOR);
        for (Usuario gestor : gestores) {
            notificacionService.crearNotificacion(
                    gestor,
                    "Parte registrado - Incidencia #" + inc.getId(),
                    "El técnico " + inc.getTecnico().getNombre() + " ha cerrado la incidencia #" + inc.getId() + " con un parte de trabajo.",
                    inc.getId()
            );
        }

        return new ParteTrabajoResponse(parte);
    }

    /**
     * Obtener el parte de una incidencia (gestor o el técnico dueño).
     */
    @Transactional(readOnly = true)
    public ParteTrabajoResponse obtenerPorIncidencia(Long incidenciaId, CustomUserDetails userDetails) {
        ParteTrabajo parte = parteTrabajoRepository.findByIncidenciaId(incidenciaId)
                .orElseThrow(() -> new RuntimeException("No existe parte de trabajo para la incidencia #" + incidenciaId));

        Usuario usuario = userDetails.getUsuario();
        if (usuario.getRol() == Rol.TECNICO && !parte.getTecnico().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permiso para ver el parte de una incidencia no asignada a ti");
        }
        if (usuario.getRol() == Rol.CLIENTE) {
            throw new RuntimeException("El cliente no tiene acceso directo a la consulta de partes de trabajo internos");
        }

        return new ParteTrabajoResponse(parte);
    }

    /**
     * Listar partes de trabajo: gestor ve todos; técnico ve los suyos.
     */
    @Transactional(readOnly = true)
    public List<ParteTrabajoResponse> listarPartes(CustomUserDetails userDetails) {
        Usuario usuario = userDetails.getUsuario();
        List<ParteTrabajo> lista;

        if (usuario.getRol() == Rol.GESTOR) {
            lista = parteTrabajoRepository.findAllByOrderByFechaDesc();
        } else if (usuario.getRol() == Rol.TECNICO) {
            lista = parteTrabajoRepository.findByTecnicoIdOrderByFechaDesc(usuario.getId());
        } else {
            throw new RuntimeException("Rol no autorizado para listar partes de trabajo");
        }

        return lista.stream().map(ParteTrabajoResponse::new).collect(Collectors.toList());
    }
}
