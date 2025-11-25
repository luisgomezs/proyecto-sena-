// ChatWindow.js (¡Componente Nuevo!)

import React, { useEffect, useState, useRef } from 'react';

import Swal from 'sweetalert2';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../../firebaseConfig';
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Estilos CSS para el chat (puedes ponerlos en Soporte.css)
/*
.chat-window { ... }
.messages-list { ... }
.message { ... }
.message.sent { align-self: flex-end; background-color: #dcf8c6; }
.message.received { align-self: flex-start; background-color: #f1f1f1; }
.reply-form { ... }
*/

export default function ChatWindow() {
  const { conversationId } = useParams(); // Obtiene el ID del hilo desde la URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uid, setUid] = useState(auth.currentUser?.uid);
  const messagesEndRef = useRef(null); // Para auto-scroll al final

  // 1. Suscribirse a los mensajes de ESTE hilo
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('fechaEnvio', 'asc') // 👈 Mensajes en orden cronológico
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [conversationId]);

  // 2. Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Enviar una RESPUESTA (no un nuevo hilo)
  const handleReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const timestamp = serverTimestamp();

      // 1. Añadir el nuevo mensaje a la subcolección
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        texto: newMessage,
        remitenteId: uid,
        fechaEnvio: timestamp
      });

      // 2. Actualizar el documento padre (la conversación)
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        ultimaActualizacion: timestamp,
        ultimoMensaje: newMessage.substring(0, 50) + "...",
        estado: 'pendiente' // 👈 El usuario respondió, el admin debe verlo
      });

      setNewMessage(""); // Limpiar el input

    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      Swal.fire("Error", "No se pudo enviar la respuesta", "error");
    }
  };

  return (
    <div className="chat-window">
      {/* Aquí podrías cargar y mostrar el 'asunto' del hilo */}
      {/* <h2>Asunto del Hilo</h2> */}
      <Link to="/soporte">← Volver al historial</Link>

      <div className="messages-list">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            // Comprueba si el mensaje es del usuario logueado o del admin
            className={`message ${msg.remitenteId === uid ? 'sent' : 'received'}`}
          >
            <p>{msg.texto}</p>
            <small>{msg.fechaEnvio?.toDate().toLocaleString()}</small>
          </div>
        ))}
        {/* Elemento vacío para forzar el scroll al final */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleReply} className="reply-form">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe tu respuesta..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}