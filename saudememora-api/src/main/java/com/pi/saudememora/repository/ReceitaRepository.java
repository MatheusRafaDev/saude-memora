package com.pi.saudememora.repository;

import com.pi.saudememora.model.Receita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceitaRepository extends JpaRepository<Receita, Long> {

    List<Receita> findByDocumentoId(Long idDocumento);

    // ✅ NOVO: filtro por paciente
    List<Receita> findByPacienteId(Long pacienteId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Receita r WHERE r.documento.id = :documentoId")
    void deleteAllByDocumentoId(@Param("documentoId") Long documentoId);
}