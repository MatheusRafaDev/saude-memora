package com.pi.saudememora.repository;

import com.pi.saudememora.model.Exame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ExameRepository extends JpaRepository<Exame, Long> {

    List<Exame> findByDocumentoId(Long id);

    // ✅ NOVO: filtro por paciente via documento
    @Query("SELECT e FROM Exame e WHERE e.documento.paciente.id = :pacienteId")
    List<Exame> findByDocumentoPacienteId(@Param("pacienteId") Long pacienteId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Exame e WHERE e.documento.id = :documentoId")
    void deleteAllByDocumentoId(@Param("documentoId") Long documentoId);
}