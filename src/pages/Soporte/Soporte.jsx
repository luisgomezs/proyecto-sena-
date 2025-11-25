import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import "./Soporte.css";

export default function Soporte() {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajesPendientes, setMensajesPendientes] = useState(0);
  const [mensajesRespondidos, setMensajesRespondidos] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [uid, setUid] = useState(null);
  const [usuario, setUsuario] = useState(null);

  // 🧠 Detectar usuario actual
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setUsuario(user.email);
      } else {
        setUid(null);
      }
    });
    return unsubscribe;
  }, []);

  // 📥 Cargar mensajes del usuario en tiempo real
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "mensajes"),
      where("userId", "==", uid),
      orderBy("creadoEn", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMensajesPendientes(mensajes.filter((m) => m.estado === "pendiente").length);
      setMensajesRespondidos(mensajes.filter((m) => m.estado === "respondido").length);
      setHistorial(mensajes);
    });

    return unsubscribe;
  }, [uid]);

  // 📨 Enviar nuevo mensaje
  const handleEnviarMensaje = async (e) => {
    e.preventDefault();

    if (!asunto || !mensaje) {
      Swal.fire("Campos vacíos", "Por favor completa el asunto y mensaje", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "mensajes"), {
        asunto,
        contenido: mensaje,
        userId: uid,
        remitente: usuario,
        estado: "pendiente",
        creadoEn: serverTimestamp(),
      });

      Swal.fire({
        icon: "success",
        title: "Mensaje enviado correctamente 🎉",
        text: "Nuestro equipo de soporte técnico te responderá pronto.",
        confirmButtonColor: "#16a34a",
      });

      setAsunto("");
      setMensaje("");
    } catch (error) {
      Swal.fire("Error", "No se pudo enviar el mensaje", "error");
    }
  };

  return (
    <div className="soporte-container">
      {/* 🔙 Botón de regreso */}
      <div className="volver-inicio">
        <Link to="/dashboard" className="btn-volver">
           Volver al Inicio
        </Link>
      </div>

      <h2>Centro de Soporte</h2>
      <p>Envía tus consultas y recibe ayuda del equipo de soporte técnico</p>

      {/* Estadísticas */}
      <div className="soporte-stats">
        <div className="stat-pendiente">
          <h4>Mensajes Pendientes</h4>
          <p>{mensajesPendientes}</p>
        </div>
        <div className="stat-respondido">
          <h4>Mensajes Respondidos</h4>
          <p>{mensajesRespondidos}</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleEnviarMensaje} className="form-soporte">
        <label>Asunto</label>
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Describe brevemente tu consulta"
        />

        <label>Mensaje</label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe los detalles de tu consulta o problema..."
        ></textarea>

        <button type="submit" className="btn-enviar">
          Enviar Mensaje
        </button>
      </form>

      {/* Historial */}
      <h3>Historial de Mensajes</h3>
      {historial.length === 0 ? (
        <p>No has enviado ningún mensaje aún.</p>
      ) : (
        historial.map((m) => (
          <div key={m.id} className={`msg-card ${m.estado}`}>
            <h4>{m.asunto}</h4>
            <p>{m.contenido}</p>
            <small>
              Estado:{" "}
              <span className={m.estado === "pendiente" ? "amarillo" : "verde"}>
                {m.estado}
              </span>
            </small>
            {m.respuesta && (
              <div className="respuesta">
                <strong>Respuesta del soporte:</strong>
                <p>{m.respuesta}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
