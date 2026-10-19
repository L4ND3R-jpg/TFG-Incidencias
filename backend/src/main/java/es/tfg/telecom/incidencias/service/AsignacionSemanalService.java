package es.tfg.telecom.incidencias.service;

import es.tfg.telecom.incidencias.dto.AsignacionSemanalRequest;
import es.tfg.telecom.incidencias.dto.AsignacionSemanalResponse;
import es.tfg.telecom.incidencias.dto.UsuarioSummaryDto;
import es.tfg.telecom.incidencias.entity.AsignacionSemanal;
import es.tfg.telecom.incidencias.entity.Rol;
import es.tfg.telecom.incidencias.entity.TipoAsignacion;
import es.tfg.telecom.incidencias.entity.Usuario;
import es.tfg.telecom.incidencias.repository.AsignacionSemanalRepository;
import es.tfg.telecom.incidencias.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AsignacionSemanalService {

    private final AsignacionSemanalRepository asignacionSemanalRepository;
    private final UsuarioRepository usuarioRepository;

    public AsignacionSemanalService(AsignacionSemanalRepository asignacionSemanalRepository,
                                   UsuarioRepository usuarioRepository) {
        this.asignacionSemanalRepository = asignacionSemanalRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Devuelve las asignaciones de una semana y año determinados.
     */
    public List<AsignacionSemanalResponse> obtenerAsignaciones(Integer anio, Integer semana) {
        LocalDate hoy = LocalDate.now();
        if (anio == null) anio = hoy.get(IsoFields.WEEK_BASED_YEAR);
        if (semana == null) semana = hoy.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        return asignacionSemanalRepository.findByAnioAndSemana(anio, semana)
                .stream()
                .map(AsignacionSemanalResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * El gestor guarda o actualiza la asignación semanal de un técnico.
     */
    @Transactional
    public AsignacionSemanalResponse guardarAsignacion(AsignacionSemanalRequest request) {
        Usuario tecnico = usuarioRepository.findById(request.getTecnicoId())
                .orElseThrow(() -> new RuntimeException("Técnico no encontrado con ID: " + request.getTecnicoId()));

        if (tecnico.getRol() != Rol.TECNICO) {
            throw new RuntimeException("El usuario seleccionado no tiene rol TECNICO");
        }

        // Buscar si ya existía asignación para ese técnico en esa semana y año
        Optional<AsignacionSemanal> existente = asignacionSemanalRepository
                .findByTecnicoIdAndAnioAndSemana(request.getTecnicoId(), request.getAnio(), request.getSemana());

        AsignacionSemanal asignacion;
        if (existente.isPresent()) {
            asignacion = existente.get();
            asignacion.setTipoAsignado(request.getTipoAsignado());
        } else {
            asignacion = new AsignacionSemanal();
            asignacion.setTecnico(tecnico);
            asignacion.setAnio(request.getAnio());
            asignacion.setSemana(request.getSemana());
            asignacion.setTipoAsignado(request.getTipoAsignado());
        }

        asignacion = asignacionSemanalRepository.save(asignacion);
        return new AsignacionSemanalResponse(asignacion);
    }

    /**
     * Lista todos los técnicos activos del sistema para que el gestor pueda asignarlos.
     */
    public List<UsuarioSummaryDto> obtenerTecnicosActivos() {
        return usuarioRepository.findByRolAndActivoTrue(Rol.TECNICO)
                .stream()
                .map(UsuarioSummaryDto::new)
                .collect(Collectors.toList());
    }

    /**
     * Busca los técnicos que tienen asignado un tipo concreto de trabajo en una semana/año dados.
     */
    public List<Usuario> obtenerTecnicosParaTipoYSemana(TipoAsignacion tipo, Integer anio, Integer semana) {
        return asignacionSemanalRepository.findByAnioAndSemanaAndTipoAsignado(anio, semana, tipo)
                .stream()
                .map(AsignacionSemanal::getTecnico)
                .filter(Usuario::getActivo)
                .collect(Collectors.toList());
    }
}
