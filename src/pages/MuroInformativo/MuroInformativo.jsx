// src/pages/MuroInformativo.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { db, auth } from "../../firebaseConfig";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import infobankLogo from "../../assets/infobank-logo.png"; 
import "./Muro.css";
import { useTheme } from "../../context/ThemeContext";

export default function MuroInformativo() {
  const [posts, setPosts] = useState([]);
  const [categoria, setCategoria] = useState("Todas");
  const [buscar, setBuscar] = useState("");
  
  // --- Estado para Usuario (Soporte) ---
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  
  const { isDarkMode } = useTheme();

  // 1. Detectar Usuario Logueado
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUid(u.uid);
        setUserEmail(u.email);
      } else {
        setUid(null);
        setUserEmail(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Cargar Posts del Muro
  useEffect(() => {
    const q = query(collection(db, "muro"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
    }, (error) => {
      console.error("Error al obtener datos del Muro:", error);
    });
    return () => unsub();
  }, []);

  const categorias = [
    "Todas",
    "Anuncios Generales",
    "Eventos internos",
    "Actualizaciones Operativas",
    "Reconocimientos y Logros",
    "Salud y Bienestar",
    "Capacitaciones y Desarrollo",
  ];

  // Filtro
  const filtrados = posts.filter((p) => {
    const coincideCat = categoria === "Todas" || p.categoria === categoria;
    const q = buscar.trim().toLowerCase();
    const coincideTexto =
      q === "" ||
      (p.titulo || "").toLowerCase().includes(q) ||
      (p.mensaje || "").toLowerCase().includes(q) ||
      (p.autor || "").toLowerCase().includes(q);
    return coincideCat && coincideTexto;
  });

  // 3. FUNCIÓN: Soporte Técnico (ACTUALIZADA PARA CONECTAR CON EL ADMIN)
  const handleSoporte = async () => {
    // Pedimos ASUNTO y CONTENIDO para que coincida con tu base de datos
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
        // Guardamos en la colección "mensajes" (la que usa el Admin)
        await addDoc(collection(db, "mensajes"), {
          userId: uid || "anonimo",
          remitente: userEmail || "anonimo",
          asunto: asunto || "Consulta desde Muro",
          contenido: contenido,
          creadoEn: serverTimestamp(),
          estado: "pendiente",
          respuesta: "",
          leido: false
        });

        Swal.fire('Enviado', 'El administrador ha recibido tu mensaje.', 'success');
      } catch (error) {
        console.error("Error enviando soporte:", error);
        Swal.fire('Error', 'No se pudo enviar el mensaje.', 'error');
      }
    }
  };

  return (
    <main 
      className={`muro ${isDarkMode ? "dark" : ""}`}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <header className="muro__topbar">
        <Link to="/dashboard" className="muro__back">Volver al Inicio</Link>
        <div className="muro__title">
          <MuroIconTop />
          <h1>Muro Informativo</h1>
        </div>
        <img className="muro__brand" src={infobankLogo} alt="InfoBank" />
      </header>

      <div className="muro__bar" />

      <section className="muro__container" style={{ flex: 1 }}>
        <aside className="muro__sidebar">
          <h3>Categorías</h3>
          <ul className="muro__cats">
            {categorias.map((cat) => (
              <li key={cat}>
                <button
                  className={`muro__cat ${categoria === cat ? "active" : ""}`}
                  onClick={() => setCategoria(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>

          <div className="muro__stats">
            <h3>📊 Estadísticas</h3>
            <p>Total de publicaciones</p>
            <div className="muro__stats-value">{posts.length}</div>
          </div>
        </aside>

        <section className="muro__feed">
          <div className="muro__search">
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="🔎 Buscar publicaciones..."
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="muro__empty">No hay publicaciones para mostrar.</div>
          ) : (
            filtrados.map((p) => (
              <Link to={`/muro/${p.id}`} key={p.id} className="muro__card-link">
                <article className="muro__card">
                  <div className="muro__card-meta">
                    <div className="muro__avatar" style={{ backgroundColor: "#e2e2ecff" }}>
                      {(p.autor || "A")[0].toUpperCase()}
                    </div>
                    <div className="muro__meta-txt">
                      <div className="muro__author">
                        {p.autor || "Admin"}
                      </div>
                      <div className="muro__date">
                        {p.fecha?.toDate ? p.fecha.toDate().toLocaleString("es-ES", {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : "Fecha no disponible"}
                      </div>
                    </div>
                    <span className="muro__tag">{p.prioridad || p.categoria || "General"}</span>
                  </div>

                  {p.titulo && <h2 className="muro__card-title">{p.titulo}</h2>}
                  
                  <p className="muro__card-body">
                    {(p.mensaje || "").substring(0, 150)} 
                    {(p.mensaje || "").length > 150 ? "..." : ""}
                  </p>
                  
                </article>
              </Link>
            ))
          )}
        </section>
      </section>

      {/* ========================================== */}
      {/* FOOTER / PIE DE PÁGINA CON SOPORTE       */}
      {/* ========================================== */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        textAlign: 'center', 
        borderTop: '1px solid #eee', 
        color: '#666',
        fontSize: '0.9rem'
      }}>
        
        {/* Enlace de Soporte */}
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

        {/* Copyright */}
        <div>
          © 2025 InfoBank. Todos los derechos reservados.
        </div>
      </footer>

    </main>
  );
}

// Icono (sin cambios)
function MuroIconTop() {
  const { isDarkMode } = useTheme();
  const iconColor = isDarkMode ? "#c4b5fd" : "#d5cee0ff";

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={iconColor} aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}