import React from 'react';
import { Link, useParams } from 'react-router-dom';

// Esta página solo muestra el contenido. 
// La lógica de "marcar como visto" ya sucedió en CursoDetalle.jsx

export default function Contenido() {
  const { id } = useParams(); // Obtiene el ID del curso de la URL

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Página de Contenido del Curso</h1>
      <p>Aquí pondrías tus videos, lecturas, PDFs, etc.</p>
      
      {/* ... Tu contenido va aquí ... */}

      <br />
      <Link to={`/cursos/${id}`}>
        ← Volver a los detalles del curso
      </Link>
    </div>
  );
}