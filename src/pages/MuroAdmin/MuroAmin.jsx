import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";

const MuroAdmin = () => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevo, setNuevo] = useState({
    mensaje: "",
    autor: "",
    prioridad: "Media",
  });

  const cargarMensajes = async () => {
    const snapshot = await getDocs(collection(db, "muro informativo"));
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMensajes(docs);
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  const publicarMensaje = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "muro informativo"), {
        ...nuevo,
        fecha: Timestamp.now(),
      });
      Swal.fire("Publicado", "Mensaje agregado al muro", "success");
      setNuevo({ mensaje: "", autor: "", prioridad: "Media" });
      cargarMensajes();
    } catch (error) {
      Swal.fire("Error", "No se pudo publicar el mensaje", "error");
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">🧱 Muro Informativo</h2>
      <form onSubmit={publicarMensaje} className="space-y-3 mb-6">
        <textarea
          placeholder="Escribe el mensaje..."
          value={nuevo.mensaje}
          onChange={(e) => setNuevo({ ...nuevo, mensaje: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Autor o área"
          value={nuevo.autor}
          onChange={(e) => setNuevo({ ...nuevo, autor: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <select
          value={nuevo.prioridad}
          onChange={(e) => setNuevo({ ...nuevo, prioridad: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option>Alta</option>
          <option>Media</option>
          <option>Baja</option>
        </select>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Publicar
        </button>
      </form>

      <h3 className="font-semibold mb-2">📋 Mensajes publicados</h3>
      {mensajes.map((m) => (
        <div key={m.id} className="border p-3 rounded mb-2">
          <p>{m.mensaje}</p>
          <small className="text-gray-500">
            {m.autor} - Prioridad: {m.prioridad}
          </small>
        </div>
      ))}
    </div>
  );
};

export default MuroAdmin;
