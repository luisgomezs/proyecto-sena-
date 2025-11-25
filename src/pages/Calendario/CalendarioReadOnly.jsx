import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const CalendarioReadOnly = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = collection(db, 'calendario');
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Calendario (Solo lectura)</h2>
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
        height="auto"
        eventColor="#3788d8"
        // Sin dateClick ni eventClick → solo lectura
      />
    </div>
  );
};

export default CalendarioReadOnly;