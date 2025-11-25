import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig"; // 🔧 Ajusta si tu ruta es distinta
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "./PerfilUsuario.css";

export default function PerfilUsuario() {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [usuario, setUsuario] = useState(null);

  const [enrolments, setEnrolments] = useState([]); // {userId, courseId, status, progress, ...}
  const [coursesMap, setCoursesMap] = useState({}); // courseId -> curso

  const navigate = useNavigate();

  // 👉 Helper para formatear fechas (admite Timestamp o string ISO)
  const formatoFecha = (valor) => {
    if (!valor) return "—";
    try {
      if (typeof valor?.toDate === "function") return valor.toDate().toLocaleDateString();
      return new Date(valor).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // 1) Espera al usuario autenticado y suscribe a su documento y a sus enrolments
  useEffect(() => {
    let unsubUserDoc = null;
    let unsubEnrol = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUsuario(null);
        setEnrolments([]);
        setMensaje("No hay usuario autenticado.");
        setLoading(false);
        return;
      }

      // Perfil en tiempo real
      const userRef = doc(db, "usuarios", user.uid);
      unsubUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setUsuario({ id: snap.id, ...snap.data(), uid: user.uid });
            setMensaje("");
          } else {
            setUsuario(null);
            setMensaje("No se encontró información del usuario.");
          }
          setLoading(false);
        },
        (err) => {
          console.error("PerfilUsuario:onSnapshot(usuario) ->", err);
          setMensaje("Error al obtener datos del usuario.");
          setLoading(false);
        }
      );

      // Enrolments del usuario en tiempo real
      const q = query(collection(db, "enrolments"), where("userId", "==", user.uid));
      unsubEnrol = onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setEnrolments(rows);
        },
        (err) => {
          console.error("PerfilUsuario:onSnapshot(enrolments) ->", err);
        }
      );
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubEnrol) unsubEnrol();
      unsubAuth();
    };
  }, []);

  // 2) Cada vez que cambian las inscripciones, trae (una vez) los cursos necesarios
  useEffect(() => {
    const needed = Array.from(new Set(enrolments.map((e) => e.courseId))).filter(
      (id) => id && !coursesMap[id]
    );
    if (!needed.length) return;

    let isActive = true;

    (async () => {
      const updates = {};
      await Promise.all(
        needed.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, "cursos", id));
            if (snap.exists()) {
              updates[id] = { id: snap.id, ...snap.data() };
            } else {
              updates[id] = { id, nombre: "(Curso no disponible)" };
            }
          } catch (e) {
            console.error("PerfilUsuario:getDoc(curso) ->", e);
            updates[id] = { id, nombre: "(Error al cargar curso)" };
          }
        })
      );
      if (isActive && Object.keys(updates).length) {
        setCoursesMap((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      isActive = false;
    };
  }, [enrolments, coursesMap]);

  // 3) Derivados para UI: en progreso, completados, promedio de avance
  const inProgress = useMemo(
    () => enrolments.filter((e) => e.status === "en_progreso"),
    [enrolments]
  );
  const completed = useMemo(
    () => enrolments.filter((e) => e.status === "completado"),
    [enrolments]
  );
  const avgProgress = useMemo(() => {
    if (!enrolments.length) return 0;
    const sum = enrolments.reduce((acc, e) => acc + (Number(e.progress) || 0), 0);
    return Math.round(sum / enrolments.length);
  }, [enrolments]);

  // ====== ESTADOS DE UI ======
  if (loading) return <p className="loading">Cargando información…</p>;

  if (!usuario) {
    return (
      <main className="perfil">
        <header className="perfil__header">
          <button className="btn btn--back" onClick={() => navigate("/dashboard")}>
            ← Volver al Inicio
          </button>
          <h1>Mi Perfil</h1>
        </header>

        <section className="perfil__empty">
          <p>{mensaje || "No se encontró información del usuario."}</p>
          <div className="empty__actions">
            <Link className="btn btn--primary" to="/configuracion">Completar mi perfil</Link>
            <Link className="btn btn--ghost" to="/dashboard">Ir al dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  // ====== VISTA NORMAL DEL PERFIL (con datos reales) ======
  return (
    <main className="perfil">
      <header className="perfil__header">
        <button className="btn btn--back" onClick={() => navigate("/dashboard")}>
           Volver al Inicio
        </button>
        <h1>Mi Perfil</h1>
      </header>

      <section className="perfil__content">
        {/* ===== COLUMNA IZQUIERDA ===== */}
        <aside className="perfil__left">
          <div className="perfil__card perfil__info">
            
            {/* --- INICIO DE LA FOTO --- */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <img 
                src="/nombre-de-tu-foto.png"  /* ⚠️ IMPORTANTE: Asegúrate de poner aquí la ruta correcta de tu imagen */
                alt="Foto de Perfil" 
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '5px solid white', 
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                }} 
              />
            </div>
            {/* --- FIN DE LA FOTO --- */}

            <h2>{usuario.nombre || "Usuario"} {usuario.apellido || ""}</h2>
            <p className="cargo">{usuario.cargo || "Empleado InfoBank"}</p>
            <p className="area">{usuario.areaTrabajo || "—"}</p>

            <ul className="info-list">
              <li>📧 {usuario.email || "—"}</li>
              <li>🏢 Área: {usuario.areaTrabajo || "—"}</li>
            </ul>
          </div>

          <div className="perfil__card perfil__stats">
            {/* ... el resto de las estadísticas sigue igual ... */}
            <h3>Estadísticas de Aprendizaje</h3>
            <div className="stats-grid">
              <div className="stat-item green">
                <h4>{completed.length}</h4>
                <p>Completados</p>
              </div>
              <div className="stat-item blue">
                <h4>{inProgress.length}</h4>
                <p>En Progreso</p>
              </div>
              <div className="stat-item orange">
                <h4>{avgProgress}%</h4>
                <p>Promedio</p>
              </div>
              <div className="stat-item purple">
                <h4>{enrolments.length}</h4>
                <p>Total Inscritos</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== COLUMNA DERECHA ===== */}
        <section className="perfil__right">
          <div className="perfil__card">
            <h3>📘 Cursos en Progreso</h3>

            {inProgress.length === 0 && (
              <p className="muted">Aún no tienes cursos en progreso.</p>
            )}

            {inProgress.map((e) => {
              const curso = coursesMap[e.courseId] || {};
              const w = Math.max(0, Math.min(100, Number(e.progress) || 0));
              return (
                <div key={e.id} className="progress-item">
                  <div className="progress-head">
                    <strong>{curso.nombre || e.courseId}</strong>
                    <span className="badge">{w}%</span>
                  </div>
                  <div className="bar">
                    <div className="fill" style={{ width: `${w}%` }} />
                  </div>
                  <div className="progress-actions">
                    <Link to={`/curso/${e.courseId}`} className="btn btn--primary">Continuar</Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="perfil__card">
            <h3>✅ Cursos Completados</h3>

            {completed.length === 0 && (
              <p className="muted">Aún no has completado cursos.</p>
            )}

            <ul className="course-list">
              {completed.map((e) => {
                const curso = coursesMap[e.courseId] || {};
                return (
                  <li key={e.id}>
                    <span>{curso.nombre || e.courseId}</span>
                    {e.certificateUrl ? (
                      <a className="badge" href={e.certificateUrl} target="_blank" rel="noreferrer">
                        Certificado
                      </a>
                    ) : (
                      <span className="badge">100%</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          
        </section>
      </section>
    </main>
  );
}