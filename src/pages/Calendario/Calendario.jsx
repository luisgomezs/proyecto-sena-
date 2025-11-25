// src/components/Calendario.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
// --- Imports actualizados para Soporte y Auth ---
import { db, auth } from '../../firebaseConfig'; 
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import Swal from 'sweetalert2';
// ------------------------------------------------

const Calendario = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    allDay: false
  });

  // --- Estados para Usuario (Soporte) ---
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // 1. Detectar Usuario Logueado (Para el soporte y carga inicial)
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

  // 2. Cargar eventos en tiempo real
  useEffect(() => {
    // Esperamos a que auth determine el usuario, aunque la query es general
    // Si tus eventos son privados por usuario, aquí podrías filtrar por uid
    const q = query(collection(db, 'calendario'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start?.toDate(),
        end: doc.data().end?.toDate()
      }));
      setEvents(eventos);
    });

    return () => unsubscribe();
  }, []);

  // 3. FUNCIÓN: Soporte Técnico
  const handleSoporte = async () => {
    const { value: mensaje } = await Swal.fire({
      title: 'Soporte Técnico',
      input: 'textarea',
      inputLabel: 'Describe tu problema para el administrador',
      inputPlaceholder: 'Escribe aquí tu consulta...',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
    });

    if (mensaje) {
      try {
        await addDoc(collection(db, "soporte"), {
          usuarioId: uid || "anonimo",
          email: userEmail || "anonimo",
          mensaje: mensaje,
          fecha: serverTimestamp(),
          origen: "Calendario",
          leido: false
        });

        Swal.fire('Enviado', 'El administrador ha recibido tu mensaje.', 'success');
      } catch (error) {
        console.error("Error enviando soporte:", error);
        Swal.fire('Error', 'No se pudo enviar el mensaje.', 'error');
      }
    }
  };

  // Abrir modal para crear/editar
  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      start: info.dateStr,
      end: info.dateStr,
      allDay: info.allDay
    });
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setFormData({
      title: info.event.title,
      description: info.event.extendedProps.description || '',
      start: info.event.startStr.split('T').join(' '),
      end: info.event.endStr ? info.event.endStr.split('T').join(' ') : '',
      allDay: info.event.allDay
    });
    setModalOpen(true);
  };

  // Guardar evento
  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDate = new Date(formData.start);
    const endDate = formData.end ? new Date(formData.end) : null;

    // ✅ CORRECCIÓN DE ZONA HORARIA (NATIVA)
    if (!formData.allDay) {
      startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
      if (endDate) endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
    } else {
      startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(0, 0, 0, 0);
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start: new Date(formData.start),
        end: formData.end ? new Date(formData.end) : null,
        allDay: formData.allDay,
        createdBy: userEmail, // Usamos el estado actualizado
        createdAt: new Date()
      };

      if (selectedEvent) {
        await updateDoc(doc(db, 'calendario', selectedEvent.id), eventData);
        Swal.fire('¡Actualizado!', 'Evento modificado.', 'success');
      } else {
        await addDoc(collection(db, 'calendario'), eventData);
        Swal.fire('¡Creado!', 'Evento agregado al calendario.', 'success');
      }

      setModalOpen(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar el evento.', 'error');
    }
  };

  // Eliminar evento
  const handleDelete = async () => {
    if (!selectedEvent) return;

    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'calendario', selectedEvent.id));
      Swal.fire('Eliminado', 'El evento ha sido borrado.', 'success');
      setModalOpen(false);
    }
  };

  return (
    <div 
      className="calendario-container" 
      style={{ 
        padding: '20px', 
        background: 'var(--bg)', 
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh' // Para asegurar que el footer baje
      }}
    >
      
      <div style={{ flex: 1 }}>
        <h2>📅 Calendario de Eventos</h2>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale={esLocale}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateClick}
          height="auto"
          eventColor="#3788d8"
        />
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'var(--card)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px', color: 'var(--text)'
          }}>
            <h3>{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Título del evento"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                {!formData.allDay && (
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                <input
                  type="checkbox"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked, end: '' })}
                />
                <span style={{ marginLeft: '8px' }}>Todo el día</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" style={{
                  flex: 1, padding: '12px', background: '#3788d8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}>
                  {selectedEvent ? 'Actualizar' : 'Crear'}
                </button>
                {selectedEvent && (
                  <button type="button" onClick={handleDelete} style={{
                    flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                  }}>
                    Eliminar
                  </button>
                )}
                <button type="button" onClick={() => setModalOpen(false)} style={{
                  flex: 1, padding: '12px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;