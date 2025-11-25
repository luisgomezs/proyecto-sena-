// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// --- MODIFICADO: Agregamos onAuthStateChanged ---
import { signOut, onAuthStateChanged } from "firebase/auth"; 
import { auth, db } from "../../firebaseConfig";
// --- MODIFICADO: Agregamos doc y getDoc ---
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore"; 
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import "./Dashboard.css";

// DATOS ESTÁTICOS PARA EL PANEL
const staticNotifications = [
  {
    id: 1,
    title: "Recordatorios de Cursos",
    description: "Te recordaremos las fechas límite de tus cursos inscritos.",
    icon: "book",
  },
  {
    id: 2,
    title: "Alertas de Noticias Urgentes",
    description: "Recibe notificaciones inmediatas sobre comunicados urgentes.",
    icon: "alert",
  },
  {
    id: 3,
    title: "Actualizaciones del Sistema",
    description: "Mantente informado sobre mantenimientos y nuevas funciones.",
    icon: "gear",
  },
];

// COMPONENTE DE ESTILOS
const NotificationStyles = () => (
  <style>{`
    /* --- ESTILOS DE NOTIFICACIÓN --- */
    .dash__actions { position: relative; display: flex; align-items: center; gap: 12px; }
    .notification-area { position: relative; display: flex; align-items: center; }
    .btn--icon { padding: 8px 10px; line-height: 0; }
    .notifications-dropdown {
      position: absolute; top: 130%; right: 0; width: 340px; background-color: #ffffff;
      border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border: 1px solid #eee; z-index: 1000; overflow: hidden;
    }
    .notifications-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; background-color: #fcfcfc; }
    .notifications-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .notifications-header button { background: none; border: none; font-size: 1.5rem; font-weight: 300; color: #888; cursor: pointer; }
    .notifications-list { list-style: none; padding: 0; margin: 0; max-height: 400px; overflow-y: auto; }
    .notification-item { display: flex; align-items: flex-start; padding: 16px; border-bottom: 1px solid #f0f0f0; transition: background-color 0.2s; }
    .notification-item:last-child { border-bottom: none; }
    .notification-item:hover { background-color: #f9f9f9; }
    .notification-icon { font-size: 1.5rem; margin-right: 12px; margin-top: 2px; }
    .notification-content strong { display: block; font-size: 0.9rem; font-weight: 600; color: #333; margin-bottom: 4px; }
    .notification-content p { font-size: 0.85rem; color: #666; margin: 0; line-height: 1.4; }

    /* --- ESTILOS DEL NUEVO FOOTER --- */
    .dash__footer { text-align: center; padding: 24px 20px; margin-top: 48px; border-top: 1px solid #f0f0f0; color: #888; font-size: 0.85rem; }
    .dash__footer nav { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }
    .dash__footer-link { color: #555; font-weight: 500; text-decoration: none; }
    .dash__footer-link:hover { text-decoration: underline; }

    /* --- COLORES DE TARJETAS --- */
    .card--teal {
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    }
  `}</style>
);

// COMPONENTE CALENDARIO EN TARJETA (REUTILIZADO EN MODAL)
function CalendarCard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = collection(db, 'calendario');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Sin título',
        start: doc.data().start?.toDate(),
        end: doc.data().end?.toDate(),
        allDay: doc.data().allDay || false,
        description: doc.data().description || ''
      }));
      setEvents(eventos);
    }, (error) => {
      console.error("Error cargando calendario:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <article style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      height: '100%'
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: '#2c3e50' }}>
        Calendario de Eventos
      </h3>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        }}
        locale={esLocale}
        events={events}
        height="100%"
        eventColor="#3498db"
        eventTextColor="white"
        displayEventTime={true}
        nowIndicator={true}
        editable={false}
        selectable={false}
      />
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // --- NUEVO: Estado para el nombre del usuario ---
  const [nombreUsuario, setNombreUsuario] = useState("");

  // --- NUEVO: Efecto para obtener el nombre del usuario ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Intentamos buscar en la colección "users" por UID
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().nombre) {
            // Si existe en base de datos, usamos ese nombre
            setNombreUsuario(docSnap.data().nombre);
          } else if (user.displayName) {
            // Si no, usamos el displayName de Auth (Google/Provider)
            setNombreUsuario(user.displayName);
          } else {
            // Si no, usamos la parte antes del @ del email
            setNombreUsuario(user.email.split('@')[0]);
          }
        } catch (error) {
          console.error("Error al obtener nombre:", error);
          // Fallback básico
          setNombreUsuario(user.email ? user.email.split('@')[0] : "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Ocurrió un error al cerrar sesión.");
    }
  };

  return (
    <main className="dash">
      <NotificationStyles />

      <header className="dash__topbar">
        <div className="dash__brand">
          {/* --- MODIFICADO: Aquí mostramos el nombre --- */}
          <h1 className="dash__title">
            {nombreUsuario ? `Bienvenido a Infobank ${nombreUsuario}` : "Bienvenido a InfoBank"}
          </h1>
          <p className="dash__subtitle">
            Accede a todos los recursos y servicios disponibles
          </p>
        </div>

        <div className="dash__actions">
          <Link className="btn btn--profile" to="/perfil">
            <UserIcon /> Mi Perfil
          </Link>

          <button className="btn btn--ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* GRID DE TARJETAS */}
      <section className="dash__grid" aria-label="Accesos principales">
        <Card
          color="blue"
          title="Cursos"
          desc="Accede a todos los cursos y materiales de formación disponibles"
          cta="Ver Cursos"
          to="/cursos"
          icon={<BookIcon />}
        />
        <Card
          color="green"
          title="Noticias"
          desc="Mantente al día con las últimas noticias y actualizaciones"
          cta="Ver Noticias"
          to="/noticias"
          icon={<NewsIcon />}
        />
        <Card
          color="purple"
          title="Muro Informativo"
          desc="Publicaciones, anuncios y actualizaciones importantes"
          cta="Ver Muro"
          to="/muro"
          icon={<MuroIcon />}
        />

        {/* NUEVA TARJETA: CALENDARIO */}
        <article 
          className="card card--teal"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowCalendarModal(true)}
        >
          <div className="card__icon" aria-hidden="true">
            <CalendarIcon />
          </div>
          <h3 className="card__title">Calendario</h3>
          <p className="card__desc">
            Revisa fechas importantes, capacitaciones y eventos del banco
          </p>
          <button 
            className="btn btn--cta"
            onClick={(e) => {
              e.stopPropagation();
              setShowCalendarModal(true);
            }}
          >
            Ver Calendario
          </button>
        </article>

        <Card
          color="orange"
          title="Configuración"
          desc="Administra tu perfil y configuraciones de cuenta"
          cta="Configurar"
          to="/configuracion"
          icon={<CogIcon />}
        />
      </section>

      {/* MODAL DEL CALENDARIO */}
      {showCalendarModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
          onClick={() => setShowCalendarModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '1100px',
              height: '90vh',           
              maxHeight: '800px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* CABECERA */}
            <div style={{
              padding: '1.2rem 1.8rem',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa',
              flexShrink: 0
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#2c3e50', 
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                Calendario de Eventos
              </h2>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  color: '#999',
                  fontWeight: '300',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>

            {/* CALENDARIO - CRECE AL 100% */}
            <div style={{ 
              flex: 1, 
              minHeight: 0, 
              padding: '1rem',
              overflow: 'hidden'
            }}>
              <CalendarCard />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="dash__footer">
        <nav>
          <Link to="/soporte" className="dash__footer-link">
            Soporte Técnico
          </Link>
          <Link to="/acerca-de" className="dash__footer-link">
            Acerca de InfoBank
          </Link>
        </nav>
        <p>
          © {new Date().getFullYear()} InfoBank. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  );
}

// COMPONENTE CARD
function Card({ icon, title, desc, cta, to, color = "blue" }) {
  return (
    <article className={`card card--${color}`}>
      <div className="card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="card__title">{title}</h3>
      <p className="card__desc">{desc}</p>
      <Link className="btn btn--cta" to={to} aria-label={`${cta} - ${title}`}>
        {cta}
      </Link>
    </article>
  );
}

/* ===== ICONOS SVG ===== */
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V8c0-3.07-1.63-5.64-4.5-6.32V1.5a1.5 1.5 0 0 0-3 0v.18C7.63 2.36 6 4.93 6 8v8l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h9a3 3 0 0 1 3 3v10.5a.5.5 0 0 1-.79.41L15 16.5l-2.21 1.41a.5.5 0 0 1-.58 0L10 16.5 7.79 17.9a.5.5 0 0 1-.79-.41V7a3 3 0 0 1 3-3z" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 5h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5zm3 3v2h8V8H7zm0 4v2h8v-2H7z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94a7.52 7.52 0 0 0 .05-.94 7.52 7.52 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.55 7.55 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 12.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L.71 7.98a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L.83 13.66a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.52.4 1.06.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49.42l.36-2.54c.57-.23 1.11-.54 1.63.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM11 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
    </svg>
  );
}

function MuroIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.86 1.28-3.41 3.2-4A13.86 13.86 0 0 0 8 13Zm8 0a9.59 9.59 0 0 0-2.54.34 6 6 0 0 1 2.54 4.66V19h8v-2c0-2.66-5.33-4-8-4Z" />
    </svg>
  );
}

// ÍCONO DEL CALENDARIO
function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
      <rect x="7" y="11" width="2" height="2"/>
      <rect x="11" y="11" width="2" height="2"/>
      <rect x="15" y="11" width="2" height="2"/>
      <rect x="7" y="15" width="2" height="2"/>
      <rect x="11" y="15" width="2" height="2"/>
      <rect x="15" y="15" width="2" height="2"/>
    </svg>
  );
}