import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import ImageUploader from "../../components/ImageUploadeer"; // ← IMPORTANTE
import "./PerfilUsuario.css";

export default function PerfilUsuario() {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [usuario, setUsuario] = useState(null);

  const [enrolments, setEnrolments] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});

  // ====== NUEVOS ESTADOS PARA FOTO ======
  const [editandoFoto, setEditandoFoto] = useState(false);
  const [cargandoFoto, setCargandoFoto] = useState(false);

  const navigate = useNavigate();

  const formatoFecha = (valor) => {
    if (!valor) return "—";
    try {
      if (typeof valor?.toDate === "function") return valor.toDate().toLocaleDateString();
      return new Date(valor).toLocaleDateString();
    } catch {
      return "—";
    }
  };

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
          console.error("Error en perfil:", err);
          setMensaje("Error al cargar el perfil.");
          setLoading(false);
        }
      );

      const q = query(collection(db, "enrolments"), where("userId", "==", user.uid));
      unsubEnrol = onSnapshot(q, (snap) => {
        setEnrolments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubUserDoc?.();
      unsubEnrol?.();
      unsubAuth();
    };
  }, []);

  // Cursos necesarios
  useEffect(() => {
    const needed = Array.from(new Set(enrolments.map((e) => e.courseId))).filter(
      (id) => id && !coursesMap[id]
    );
    if (!needed.length) return;

    let active = true;
    (async () => {
      const updates = {};
      await Promise.all(
        needed.map(async (id) => {
          const snap = await getDoc(doc(db, "cursos", id));
          updates[id] = snap.exists()
            ? { id: snap.id, ...snap.data() }
            : { id, nombre: "(Curso eliminado)" };
        })
      );
      if (active) setCoursesMap((prev) => ({ ...prev, ...updates }));
    })();
    return () => { active = false; };
  }, [enrolments, coursesMap]);

  const inProgress = useMemo(() => enrolments.filter((e) => e.status === "en_progreso"), [enrolments]);
  const completed = useMemo(() => enrolments.filter((e) => e.status === "completado"), [enrolments]);
  const avgProgress = useMemo(() => {
    if (!enrolments.length) return 0;
    const sum = enrolments.reduce((acc, e) => acc + (Number(e.progress) || 0), 0);
    return Math.round(sum / enrolments.length);
  }, [enrolments]);

  // ====== FUNCIÓN PARA GUARDAR NUEVA FOTO ======
  const handleCambiarFoto = async (url) => {
    if (!usuario?.id) return;
    setCargandoFoto(true);
    try {
      await updateDoc(doc(db, "usuarios", usuario.id), {
        fotoEmpleado: url,
      });
      Swal.fire({
        icon: "success",
        title: "¡Foto actualizada!",
        timer: 1500,
        showConfirmButton: false,
      });
      setEditandoFoto(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo guardar la foto", "error");
    } finally {
      setCargandoFoto(false);
    }
  };

  if (loading) return <p className="loading">Cargando perfil…</p>;
  if (!usuario) {
    return (
      <main className="perfil">
        <header className="perfil__header">
          <button className="btn btn--back" onClick={() => navigate("/dashboard")}>← Volver</button>
          <h1>Mi Perfil</h1>
        </header>
        <section className="perfil__empty">
          <p>{mensaje}</p>
          <Link className="btn btn--primary" to="/dashboard">Ir al Dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="perfil">
      <header className="perfil__header">
        <button className="btn btn--back" onClick={() => navigate("/dashboard")}>
          ← Volver al Inicio
        </button>
        <h1>Mi Perfil</h1>
      </header>

      <section className="perfil__content">
        {/* COLUMNA IZQUIERDA */}
        <aside className="perfil__left">
          <div className="perfil__card perfil__info">
            {/* ====== FOTO CON BOTÓN DE CAMBIO ====== */}
            <div className="avatar-container" style={{ position: "relative", display: "inline-block" }}>
              <div className="avatar">
                {usuario.fotoEmpleado ? (
                  <img
                    src={usuario.fotoEmpleado}
                    alt="Mi foto"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>

              {/* Botón flotante de cámara */}
              <div
                onClick={() => setEditandoFoto(true)}
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                  border: "3px solid white",
                  fontSize: "24px",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                title="Cambiar foto de perfil"
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                +
              </div>

            </div>

            <h2>{usuario.nombre} {usuario.apellido}</h2>
            <p className="cargo">{usuario.cargo || "Empleado InfoBank"}</p>
            <p className="area">{usuario.areaTrabajo || "—"}</p>

            <ul className="info-list">
              <li>Email: {usuario.email}</li>
              <li>Area: {usuario.areaTrabajo || "—"}</li>
            </ul>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="perfil__card perfil__stats">
            <h3>Estadísticas de Aprendizaje</h3>
            <div className="stats-grid">
              <div className="stat-item green"><h4>{completed.length}</h4><p>Completados</p></div>
              <div className="stat-item blue"><h4>{inProgress.length}</h4><p>En Progreso</p></div>
              <div className="stat-item orange"><h4>{avgProgress}%</h4><p>Promedio</p></div>
              <div className="stat-item purple"><h4>{enrolments.length}</h4><p>Total Inscritos</p></div>
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA */}
        <section className="perfil__right">
          <div className="perfil__card">
            <h3>Cursos en Progreso</h3>
            {inProgress.length === 0 && <p className="muted">Aún no tienes cursos en progreso.</p>}
            {inProgress.map((e) => {
              const curso = coursesMap[e.courseId] || {};
              const w = Math.max(0, Math.min(100, Number(e.progress) || 0));
              return (
                <div key={e.id} className="progress-item">
                  <div className="progress-head">
                    <strong>{curso.nombre || e.courseId}</strong>
                    <span className="badge">{w}%</span>
                  </div>
                  <div className="bar"><div className="fill" style={{ width: `${w}%` }} /></div>
                  <Link to={`/curso/${e.courseId}`} className="btn btn--primary">Continuar</Link>
                </div>
              );
            })}
          </div>

          <div className="perfil__card">
            <h3>Cursos Completados</h3>
            {completed.length === 0 && <p className="muted">Aún no has completado cursos.</p>}
            <ul className="course-list">
              {completed.map((e) => {
                const curso = coursesMap[e.courseId] || {};
                return (
                  <li key={e.id}>
                    <span>{curso.nombre || e.courseId}</span>
                    {e.certificateUrl ? (
                      <a className="badge" href={e.certificateUrl} target="_blank" rel="noreferrer">Certificado</a>
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

      {/* ====== MODAL PARA CAMBIAR FOTO ====== */}
      {editandoFoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditandoFoto(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              maxWidth: "90%",
              width: "420px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1.5rem" }}>Cambiar foto de perfil</h3>

            <ImageUploader
              currentImage={usuario.fotoEmpleado || ""}
              onImageUpload={handleCambiarFoto}
              disabled={cargandoFoto}
            />

            {cargandoFoto && <p style={{ marginTop: "1rem" }}>Guardando foto...</p>}

            <button
              className="btn btn--cancel"
              onClick={() => setEditandoFoto(false)}
              style={{ marginTop: "1rem" }}
              disabled={cargandoFoto}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}