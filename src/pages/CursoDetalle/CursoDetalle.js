import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import Swal from "sweetalert2";
import "./CursoDetalle.css";

// ===================== BLOQUE DE DESCARGA DE DOCUMENTOS =====================
const isValidUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const allowedDomains = [
  "drive.google.com",
  "docs.google.com",
  "onedrive.live.com",
  "1drv.ms",
  "dropbox.com",
  "www.dropbox.com",
];

const isAllowedDomain = (str) => {
  try {
    const { hostname } = new URL(str);
    return allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

const getViewAndDownload = (url) => {
  if (!url || !isValidUrl(url)) return { viewUrl: "", downloadUrl: "" };
  try {
    const u = new URL(url);
    const host = u.hostname;

    if (host.includes("drive.google.com")) {
      let fileId = null;
      if (u.pathname.includes("/file/d/")) {
        fileId = u.pathname.split("/file/d/")[1]?.split("/")[0] || null;
      } else if (u.searchParams.get("id")) {
        fileId = u.searchParams.get("id");
      }
      const viewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : url;
      const downloadUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
      return { viewUrl, downloadUrl };
    }

    if (host.includes("dropbox.com")) {
      const v = new URL(url);
      v.searchParams.set("dl", "0");
      const d = new URL(url);
      d.searchParams.set("dl", "1");
      return { viewUrl: v.toString(), downloadUrl: d.toString() };
    }

    if (host.includes("1drv.ms") || host.includes("onedrive.live.com")) {
      const viewUrl = url;
      const d = new URL(url);
      if (!d.searchParams.has("download")) d.searchParams.set("download", "1");
      return { viewUrl, downloadUrl: d.toString() };
    }

    return { viewUrl: url, downloadUrl: url };
  } catch {
    return { viewUrl: url, downloadUrl: url };
  }
};

const resolveDownloadUrl = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    const host = u.hostname;

    if (host.includes("dropbox.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "s") {
        const rawPath = parts.slice(0, 3).join("/");
        return `https://dl.dropboxusercontent.com/${rawPath}`;
      }
      const d = new URL(url);
      d.searchParams.set("dl", "1");
      return d.toString();
    }

    if (host.includes("drive.google.com")) {
      let fileId = null;
      if (u.pathname.includes("/file/d/")) {
        fileId = u.pathname.split("/file/d/")[1]?.split("/")[0] || null;
      } else if (u.searchParams.get("id")) {
        fileId = u.searchParams.get("id");
      }
      if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
      return url;
    }

    if (host.includes("1drv.ms") || host.includes("onedrive.live.com")) {
      const d = new URL(url);
      d.searchParams.set("download", "1");
      return d.toString();
    }

    return url;
  } catch {
    return url;
  }
};

const openInNewTab = (url) => {
  if (!url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
};

const forceDownload = async (rawUrl, suggestedName = "archivo") => {
  const url = resolveDownloadUrl(rawUrl);
  try {
    const resp = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!resp.ok) throw new Error("No OK");
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = suggestedName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.warn("Fetch falló, usando iframe", e);
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => iframe.remove(), 60_000);
    } catch (err) {
      Swal.fire("Error", "No se pudo descargar. Usa clic derecho > Guardar enlace como.", "error");
    }
  }
};

// ===================== ABRIR VIDEO EN NUEVA PESTAÑA =====================
const abrirVideoEnPestana = (videoUrl) => {
  if (!videoUrl) return;
  let urlParaAbrir = "";
  try {
    const u = new URL(videoUrl);
    const host = u.hostname.toLowerCase();

    // YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";
      if (host.includes("youtu.be")) {
        videoId = u.pathname.slice(1).split("?")[0];
      } else {
        videoId = u.searchParams.get("v");
      }
      urlParaAbrir = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Vimeo
    else if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      urlParaAbrir = `https://vimeo.com/${id}`;
    }
    // Google Drive
    else if (host.includes("drive.google.com")) {
      let fileId = u.searchParams.get("id");
      if (!fileId && u.pathname.includes("/file/d/")) {
        fileId = u.pathname.split("/file/d/")[1]?.split("/")[0];
      }
      if (fileId) {
        urlParaAbrir = `https://drive.google.com/file/d/${fileId}/view`;
      }
    }
    // Video directo (.mp4, etc.)
    else if (/\.(mp4,webm,ogg,mov)$/i.test(videoUrl)) {
      urlParaAbrir = videoUrl;
    }
    // Cualquier otra URL válida
    else if (isValidUrl(videoUrl)) {
      urlParaAbrir = videoUrl;
    }

    if (urlParaAbrir) {
      openInNewTab(urlParaAbrir);
    } else {
      Swal.fire("URL no válida", "No se pudo abrir el video.", "error");
    }
  } catch (err) {
    Swal.fire("Error", "URL del video no válida.", "error");
  }
};

// ===================== COMPONENTE PRINCIPAL =====================
export default function CursoDetalle() {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [uid, setUid] = useState(null);
  const [enrol, setEnrol] = useState(null);

  // === USUARIO ===
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return unsub;
  }, []);

  // === CARGAR CURSO ===
  useEffect(() => {
    const fetchCurso = async () => {
      const ref = doc(db, "cursos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setCurso({ id: snap.id, ...snap.data() });
    };
    fetchCurso();
  }, [id]);

  // === INSCRIPCIÓN EN TIEMPO REAL ===
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "enrolments", `${uid}_${id}`);
    const unsub = onSnapshot(ref, (snap) => {
      setEnrol(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, [uid, id]);

  // === INSCRIBIRSE ===
  const handleInscribirme = async () => {
    if (!uid) {
      Swal.fire("Inicia sesión", "Debes iniciar sesión para inscribirte.", "info");
      return;
    }
    const ref = doc(db, "enrolments", `${uid}_${id}`);
    await setDoc(ref, {
      userId: uid,
      courseId: id,
      status: "en_progreso",
      progress: 0,
      enrolledAt: serverTimestamp(),
      completedAt: null,
    });
    Swal.fire("¡Inscrito!", "Ya puedes ver el contenido del curso.", "success");
  };

  if (!curso) return <p className="loading">Cargando curso...</p>;

  const progress = enrol?.progress ?? 0;
  const isEnrolled = !!enrol;

  // === DESCARGA DE DOCUMENTO ===
  const { viewUrl, downloadUrl } = getViewAndDownload(curso.archivoEnlace || "");
  const ext = curso.archivoEnlace?.split("?")[0].match(/\.\w+$/)?.[0] || "";
  const nombreArchivo = `${curso.nombre.replace(/[^\w\-]+/g, "_")}${ext}`;

  // === CORRECCIÓN VIDEO: Buscamos la URL en varios campos posibles ===
  const videoLink = curso.videoUrl || curso.urlVideo || curso.video || "";

  const handleDocumentClick = async () => {
    openInNewTab(viewUrl);

    if (isEnrolled && uid && progress < 50) {
      const ref = doc(db, "enrolments", `${uid}_${id}`);
      try {
        await updateDoc(ref, { progress: 50 });
      } catch (error) {
        console.error("Error al actualizar progreso (50%):", error);
      }
    }
  };

  const handleVideoClick = async () => {
    // Usamos la variable corregida 'videoLink'
    abrirVideoEnPestana(videoLink);

    if (isEnrolled && uid && progress < 100) {
      const ref = doc(db, "enrolments", `${uid}_${id}`);
      try {
        await updateDoc(ref, {
          progress: 100,
          status: "completado",
          completedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error al actualizar progreso (100%):", error);
        Swal.fire("Error", "No se pudo guardar tu progreso.", "error");
      }
    }
  };

  return (
    <div className="curso-page">
      <header className="curso-header">
        <Link to="/cursos" className="btn btn--volver">Volver al Catálogo</Link>
      </header>
      <div className="curso-card-detalle">
        <div className="curso-top">
          <div className="curso-title-section">
            <h2 className="curso-titulo">{curso.nombre}</h2>
            <div className="curso-badges">
              <span className="badge badge--black">Activo</span>
              {isEnrolled ? (
                <span className="badge badge--green">Inscrito</span>
              ) : (
                <span className="badge badge--gray">No inscrito</span>
              )}
            </div>
          </div>
          {curso.imagen && <img src={curso.imagen} alt={curso.nombre} className="curso-img" />}
        </div>
        <p className="curso-descripcion">{curso.descripcion}</p>
        <div className="curso-datos">
          <div className="dato-item">
            <span className="icon">Inscritos</span>
            <strong>{curso.inscritos || 0} / {curso.cupos || "?"}</strong>
          </div>
          <div className="dato-item">
            <span className="icon">Vencimiento</span>
            <strong>{curso.fechaLimite || "Sin definir"}</strong>
          </div>
          <div className="dato-item">
            <span className="icon">Duración</span>
            <strong>{curso.duracion || "No especificada"}</strong>
          </div>
          <div className="dato-item">
            <span className="icon">Contenido</span>
            <strong>Video + Documentos</strong>
          </div>
        </div>

        {/* === DOCUMENTOS === */}
        {curso.archivoEnlace && isValidUrl(curso.archivoEnlace) && isAllowedDomain(curso.archivoEnlace) && (
          <div className="curso-documentos">
            <h4 style={{ margin: "16px 0 8px" }}>Material de Apoyo</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn btn--view" onClick={handleDocumentClick}>
                Ver Documento
              </button>
              <button className="btn btn--download" onClick={() => forceDownload(downloadUrl, nombreArchivo)}>
                Descargar
              </button>
            </div>
          </div>
        )}

        {/* === PROGRESO === */}
        {isEnrolled && (
          <div className="progreso">
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progress}%` }}>
                {progress}%
              </div>
            </div>
          </div>
        )}

        <div className="curso-footer">
          <small>
            Creado por <b>Admin InfoBank</b>
            <br />
            Fecha: {curso.createdAt?.toDate?.().toLocaleDateString() || "No disponible"}
          </small>
          <div className="botones">
            {isEnrolled ? (
              <>
                <button
                  className="btn-ver"
                  onClick={handleVideoClick}
                  // Aquí verificamos si 'videoLink' tiene algo
                  disabled={!videoLink}
                  style={{
                    backgroundColor: !videoLink ? "#ccc" : "#007bff",
                    cursor: !videoLink ? "not-allowed" : "pointer"
                  }}
                >
                  {videoLink ? "Ir al Video" : "Sin Video"}
                </button>

                <button
                  className="btn-eval"
                  disabled={progress < 100 || !curso.enlaceEvaluacion}
                  onClick={() => openInNewTab(curso.enlaceEvaluacion)}
                >
                  Presentar Evaluación
                </button>
              </>
            ) : (
              <button className="btn-inscribirse" onClick={handleInscribirme}>
                Inscribirme
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}