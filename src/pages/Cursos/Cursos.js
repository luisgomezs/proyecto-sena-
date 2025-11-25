// src/pages/Cursos/Cursos.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import "./Cursos.css";
import { useTheme } from "../../context/ThemeContext";

const formatDate = (timestamp) => {
  if (!timestamp) return "Sin fecha";
  try {
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleDateString("es-CO");
    }
    return timestamp.toDate().toLocaleDateString("es-co");
  } catch {
    return "Inválido";
  }
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  
  // CAMBIO 1: Ahora 'inscripciones' será un Objeto {}, no un Array []
  // Ejemplo: { "idCurso1": { status: "completado", progress: 100 }, ... }
  const [inscripciones, setInscripciones] = useState({});
  
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [busqueda, setBusqueda] = useState(""); 

  const navigate = useNavigate();
  const { isDarkMode } = useTheme() || {};

  // 1. DETECTAR USUARIO Y CARGAR INSCRIPCIONES CON ESTADO
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      setUserEmail(u?.email || null);
      
      if (u) {
        const q = query(collection(db, "enrolments"), where("userId", "==", u.uid));
        const snap = await getDocs(q);
        
        // Creamos un mapa: { idCurso: datosDeInscripcion }
        const enrolMap = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          enrolMap[data.courseId] = data; 
        });
        setInscripciones(enrolMap);

      } else {
        setInscripciones({});
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. CARGAR CURSOS
  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 

    const unsubCursos = onSnapshot(collection(db, "cursos"), (snapshot) => {
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0);

      const cursosFiltrados = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((curso) => {
          if (curso.estado === "archivado") return false;
          if (!curso.fechaLimite) return true;
          const fechaLimite = new Date(curso.fechaLimite);
          fechaLimite.setHours(0, 0, 0, 0);
          return fechaLimite >= ahora;
        });

      setCursos(cursosFiltrados);
    });

    return () => unsubCursos();
  }, []);

  // SOPORTE TÉCNICO
  const handleSoporte = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Soporte Técnico',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Asunto">' +
        '<textarea id="swal-input2" class="swal2-textarea" placeholder="Describe tu problema..."></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      preConfirm: () => {
        return [
          document.getElementById('swal-input1').value,
          document.getElementById('swal-input2').value
        ]
      }
    });

    if (formValues) {
      const [asunto, contenido] = formValues;
      if (!contenido) return;
      try {
        await addDoc(collection(db, "mensajes"), {
          userId: uid || "anonimo",
          remitente: userEmail || "anonimo",
          asunto: asunto || "Consulta desde Cursos",
          contenido: contenido,
          creadoEn: serverTimestamp(),
          estado: "pendiente",
          respuesta: "",
          leido: false
        });
        Swal.fire('Enviado', 'El administrador ha recibido tu mensaje.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo enviar el mensaje.', 'error');
      }
    }
  };

  // INSCRIBIRSE
  const handleInscribirse = async (curso) => {
    if (!uid) {
      Swal.fire("Error", "Debes iniciar sesión.", "error");
      navigate("/");
      return;
    }

    const enrolId = `${uid}_${curso.id}`;
    const ref = doc(db, "enrolments", enrolId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const nuevaInscripcion = {
        userId: uid,
        courseId: curso.id,
        courseName: curso.nombre,
        userEmail,
        status: "en_progreso",
        progress: 0,
        enrolledAt: serverTimestamp(),
      };

      await setDoc(ref, nuevaInscripcion);
      await updateDoc(doc(db, "cursos", curso.id), { inscritos: increment(1) });
      
      // Actualizamos estado local con el nuevo objeto
      setInscripciones((prev) => ({
        ...prev,
        [curso.id]: nuevaInscripcion
      }));

      Swal.fire("¡Inscrito!", `Te inscribiste en "${curso.nombre}"`, "success");

      await addDoc(collection(db, "notificaciones"), {
        titulo: "Nueva inscripción",
        descripcion: `${userEmail} se inscribió en "${curso.nombre}"`,
        tipo: "curso",
        leida: false,
        creadoEn: serverTimestamp(),
        cursoId: curso.id,
        usuarioId: uid,
      });
    } else {
      Swal.fire("Ya inscrito", "Ya estás en este curso.", "info");
    }
  };

  // CANCELAR
  const handleCancelar = async (curso) => {
    const confirm = await Swal.fire({
      title: "¿Cancelar inscripción?",
      html: `<p>¿Seguro que quieres cancelar <strong>"${curso.nombre}"</strong>?</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!confirm.isConfirmed) return;

    const enrolId = `${uid}_${curso.id}`;
    await deleteDoc(doc(db, "enrolments", enrolId));
    await updateDoc(doc(db, "cursos", curso.id), { inscritos: increment(-1) });
    
    // Eliminamos del estado local
    setInscripciones((prev) => {
      const copia = { ...prev };
      delete copia[curso.id];
      return copia;
    });

    Swal.fire("Cancelado", `Inscripción cancelada en "${curso.nombre}"`, "success");
  };

  const cursosVisibles = cursos.filter((curso) => {
    const texto = busqueda.toLowerCase();
    const nombre = curso.nombre ? curso.nombre.toLowerCase() : "";
    return nombre.includes(texto);
  });

  return (
    <div className={`cursos-container ${isDarkMode ? "dark" : ""}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      <div style={{ flex: 1 }}>
        <header className="cursos-header">
          <Link to="/dashboard" className="volver">Volver al Inicio</Link>
          <h2>Cursos Disponibles</h2>
        </header>

        <h3 className="cursos-title">Catálogo de Cursos</h3>
        <p className="cursos-subtitle">
          {cursos.length === 0
            ? "No hay cursos disponibles en este momento. ¡Vuelve pronto!"
            : "Explora e inscríbete en los cursos activos"}
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          <input 
            type="text"
            placeholder="🔍 Buscar curso por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>

        <div className="cursos-list">
          {cursosVisibles.length === 0 ? (
            <div className="empty-state">
              {cursos.length > 0 ? (
                <p>No se encontraron cursos con ese nombre.</p>
              ) : (
                <>
                  <p>¡Estás al día con todos tus cursos!</p>
                  <span role="img" aria-label="celebración">¡Felicidades!</span>
                </>
              )}
            </div>
          ) : (
            cursosVisibles.map((curso) => {
              // CAMBIO IMPORTANTE: Lógica de Estado
              const datosInscripcion = inscripciones[curso.id]; // Obtenemos los datos
              const estaInscrito = !!datosInscripcion; // Si existe, está inscrito
              
              // Verificamos si está completado (status 'completado' O progress 100)
              const estaTerminado = datosInscripcion?.status === 'completado' || datosInscripcion?.progress === 100;

              const diasRestantes = curso.fechaLimite
                ? Math.ceil((new Date(curso.fechaLimite) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={curso.id}
                  className={`curso-card ${estaInscrito ? "inscrito" : ""} ${
                    diasRestantes !== null && diasRestantes <= 3 ? "urgente" : ""
                  }`}
                >
                  <div className="curso-header">
                    <h4>{curso.nombre}</h4>
                    <div className="badges">
                      <span className="badge badge-activo">Activo</span>
                      
                      {/* LÓGICA DE BADGES */}
                      {estaTerminado ? (
                         <span className="badge badge-terminado">Terminado</span>
                      ) : estaInscrito ? (
                         <span className="badge badge-inscrito">Inscrito</span>
                      ) : null}

                      {diasRestantes !== null && diasRestantes <= 3 && (
                        <span className="badge badge-urgente">
                          {diasRestantes === 0 ? "¡Hoy!" : `Quedan ${diasRestantes} días`}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="curso-desc">{curso.descripcion}</p>

                  <div className="curso-info">
                    <p>
                      <strong>{curso.inscritos ?? 0}/{curso.cupos || "?"}</strong> inscritos
                    </p>
                    <p>
                      <strong>
                        {curso.fechaLimite ? formatDate(curso.fechaLimite) : "Sin límite"}
                      </strong>{" "}
                      expira
                    </p>
                    <p>
                      <strong>{curso.duracion || "No definida"}</strong>
                    </p>
                  </div>

                  <div className="curso-footer">
                    <small>Creado el {formatDate(curso.createdAt)}</small>

                    {estaInscrito ? (
                      <div className="botones-inscrito">
                        {/* Si está terminado, quizás queramos mostrar 'Ver' o 'Certificado', pero por ahora 'Ver Contenido' */}
                        <button className="btn-ver" onClick={() => navigate(`/curso/${curso.id}`)}>
                          {estaTerminado ? "Repasar" : "Ver Contenido"}
                        </button>
                        
                        {/* Ocultar botón cancelar si ya terminó el curso (opcional, aquí lo dejo visible) */}
                        {!estaTerminado && (
                          <button className="btn-cancelar" onClick={() => handleCancelar(curso)}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn-inscribirse"
                        onClick={() => handleInscribirse(curso)}
                        disabled={curso.cupos && curso.inscritos >= curso.cupos}
                      >
                        {curso.cupos && curso.inscritos >= curso.cupos
                          ? "Cupos agotados"
                          : "Inscribirse"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        textAlign: 'center', 
        borderTop: '1px solid #eee', 
        color: '#666',
        fontSize: '0.9rem'
      }}>
        <div style={{ marginBottom: '5px' }}>
          <span 
            onClick={handleSoporte} 
            style={{ 
              cursor: 'pointer', 
              color: '#0d6efd', 
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            Soporte Técnico
          </span>
        </div>
        <div>
          © 2025 InfoBank. Todos los derechos reservados.
        </div>
      </footer>

    </div>
  );
}