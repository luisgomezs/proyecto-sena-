import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Asegúrate que la ruta sea correcta

export default function Evaluacion() {
  // Obtiene los IDs de la URL (cursoId e inscripcionId)
  // Nota: en la ruta usamos "cursoId" e "inscripcionId"
  const { cursoId, inscripcionId } = useParams(); 
  const navigate = useNavigate();
  
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({}); // Guarda las respuestas del usuario
  const [cargando, setCargando] = useState(true);

  // 1. Cargar las preguntas del curso desde Firestore
  useEffect(() => {
    const cargarPreguntas = async () => {
      const q = query(
        collection(db, "evaluaciones"),
        where("cursoId", "==", cursoId)
      );
      const querySnapshot = await getDocs(q);
      const preguntasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPreguntas(preguntasData);
      setCargando(false);
    };

    cargarPreguntas();
  }, [cursoId]);

  // 2. Guardar la respuesta de un usuario en el estado
  const handleRespuesta = (preguntaId, respuestaIndex) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: respuestaIndex // { idDePregunta: 1 }
    }));
  };

  // 3. Calificar y enviar la evaluación
  const handleSubmit = async () => {
    let correctas = 0;
    preguntas.forEach(pregunta => {
      // Compara la respuesta guardada con la respuesta correcta
      if (respuestas[pregunta.id] === pregunta.respuestaCorrecta) {
        correctas++;
      }
    });

    // Calcular calificación (ej: 80%)
    const calificacion = Math.round((correctas / preguntas.length) * 100);

    try {
      // 4. Actualizar el documento de 'enrolments' en Firestore
      const inscripcionRef = doc(db, "enrolments", inscripcionId);
      await updateDoc(inscripcionRef, {
        evaluacionCompletada: true,
        calificacion: calificacion // Guarda la nota
      });

      // 5. Redirigir al usuario
      alert(`Evaluación completada. Tu nota es: ${calificacion}`);
      navigate(`/cursos/${cursoId}`); // Vuelve a la página de detalles

    } catch (error) {
      console.error("Error al guardar la evaluación:", error);
      alert("Hubo un error al guardar tu evaluación.");
    }
  };

  if (cargando) {
    return <div>Cargando evaluación...</div>;
  }
  
  if (preguntas.length === 0) {
    return <div>No hay preguntas para este curso.</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h1>Evaluación del Curso</h1>
      {preguntas.map((pregunta, index) => (
        <div key={pregunta.id} style={{ margin: '1.5rem 0', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
          <h4>{index + 1}. {pregunta.pregunta}</h4>
          {pregunta.opciones.map((opcion, i) => (
            <div key={i} style={{ margin: '0.5rem 0' }}>
              <input
                type="radio"
                name={pregunta.id}
                id={`${pregunta.id}-${i}`}
                value={i}
                onChange={() => handleRespuesta(pregunta.id, i)}
                checked={respuestas[pregunta.id] === i}
              />
              <label htmlFor={`${pregunta.id}-${i}`} style={{ marginLeft: '8px' }}>
                {opcion}
              </label>
            </div>
          ))}
        </div>
      ))}
      
      <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: '1rem' }}>
        Entregar Evaluación
      </button>
    </div>
  );
}