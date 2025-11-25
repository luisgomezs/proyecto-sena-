// src/pages/Noticias/Noticias.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// --- Imports actualizados para Soporte y Auth ---
import Swal from "sweetalert2";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from '../../firebaseConfig';
// ------------------------------------------------
import './Noticias.css';
import { useTheme } from '../../context/ThemeContext';

// --- Iconos SVG ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
// --- Fin Iconos ---

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  
  // Estados para usuario (Soporte)
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const { isDarkMode } = useTheme();

  // Estado para saber qué tarjeta está expandida
  const [idExpandido, setIdExpandido] = useState(null); 

  const categorias = ["Todas", "Corporativas", "Economía", "Eventos", "Educación Financiera", "Tecnología", "Comunicados Urgentes"];

  // 1. Detectar Usuario Logueado (Para el soporte)
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

  // 2. Cargar Noticias
  useEffect(() => {
    const q = query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    }, (error) => {
      console.error("Error fetching noticias:", error);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Lógica del Buscador
  const handleCardClick = (id) => {
    setIdExpandido(idActual => (idActual === id ? null : id));
  };

  const noticiasFiltradas = noticias
    .filter(noticia => categoriaActiva === 'Todas' || noticia.categoria === categoriaActiva)
    .filter(noticia => {
      const textoBusqueda = busqueda.toLowerCase();
      return (
        noticia.titulo?.toLowerCase().includes(textoBusqueda) ||
        noticia.descripcion?.toLowerCase().includes(textoBusqueda) ||
        noticia.autor?.toLowerCase().includes(textoBusqueda)
      );
    });

  // 4. FUNCIÓN: Soporte Técnico (ACTUALIZADA)
  // Ahora envía a la colección 'mensajes' con 'asunto' y 'contenido'
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
        // Guardamos en la colección "mensajes" (la que usa el Admin)
        await addDoc(collection(db, "mensajes"), {
          userId: uid || "anonimo",
          remitente: userEmail || "anonimo",
          asunto: asunto || "Consulta desde Noticias",
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
    // Agregamos estilos al contenedor principal para que el footer baje correctamente
    <div 
      className={`pagina-noticias-pro ${isDarkMode ? "dark" : ""}`}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <div style={{ flex: 1 }}>
        <header className="noticias-header-pro">
          <h2>Noticias Publicadas</h2>
          <Link to="/dashboard" className="btn-volver">Volver al inicio</Link>
        </header>

        <div className="controles-noticias">
          <input
            type="text"
            className="search-bar"
            placeholder="Buscar por título, autor o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="category-filters">
            {categorias.map(cat => (
              <button
                key={cat}
                className={`category-btn ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <main className="feed-noticias">
          {cargando && <p>Cargando...</p>}
          
          {!cargando && noticiasFiltradas.length === 0 && (
            <p className="no-noticias">No hay noticias que coincidan con los filtros actuales.</p>
          )}

          {!cargando && noticiasFiltradas.map(noticia => {
            const estaExpandida = noticia.id === idExpandido;

            return (
              <article
                key={noticia.id}
                className="noticia-card-pro clickable"
                onClick={() => handleCardClick(noticia.id)}
              >
                <div className="card-content">
                  <span className="card-category-tag">{noticia.categoria || 'General'}</span>
                  <h3 className="card-title-pro">{noticia.titulo}</h3>

                  {/* Descripción que se expande al hacer clic */}
                  <p className={`card-description-pro ${estaExpandida ? 'expanded' : ''}`}>
                    {noticia.descripcion}
                  </p>

                  <div className="card-meta-pro">
                    <div className="meta-item">
                      <CalendarIcon />
                      <span>
                        {noticia.fechaPublicacion?.toDate 
                          ? noticia.fechaPublicacion.toDate().toLocaleDateString("es-ES") 
                          : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <UserIcon />
                      <span>{noticia.autor || 'Administrador'}</span>
                    </div>
                  </div>
                </div>

                {/* Imagen (visible siempre) */}
                {noticia.imagen && (
                  <div className="card-image">
                    <img
                      src={noticia.imagen}
                      alt={noticia.titulo || 'Imagen de noticia'}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/250x150/cccccc/ffffff?text=Imagen+no+disponible';
                        e.target.alt = 'Imagen no disponible';
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </main>
      </div>

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

    </div>
  );
}