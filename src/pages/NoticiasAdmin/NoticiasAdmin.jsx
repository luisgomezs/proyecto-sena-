import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";

const NoticiasAdmin = () => {
  const [noticias, setNoticias] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    descripcion: "",
    autor: "",
  });

  // Cargar noticias
  const obtenerNoticias = async () => {
    const querySnapshot = await getDocs(collection(db, "noticias"));
    const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setNoticias(docs);
  };

  useEffect(() => {
    obtenerNoticias();
  }, []);

  // Agregar noticia
  const agregarNoticia = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "noticias"), {
        ...form,
        fecha: Timestamp.now(),
      });
      Swal.fire("Éxito", "Noticia publicada correctamente", "success");
      setForm({ titulo: "", categoria: "", descripcion: "", autor: "" });
      obtenerNoticias();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar la noticia", "error");
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">📢 Publicar Noticias</h2>
      <form onSubmit={agregarNoticia} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Categoría (Ej: Tecnología, Educación)"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <textarea
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Autor o departamento"
          value={form.autor}
          onChange={(e) => setForm({ ...form, autor: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Publicar
        </button>
      </form>

      <h3 className="font-semibold mb-2">📰 Noticias Publicadas</h3>
      {noticias.map((n) => (
        <div key={n.id} className="border p-3 rounded mb-2">
          <h4 className="font-bold">{n.titulo}</h4>
          <p className="text-sm text-gray-500">{n.categoria} - {n.autor}</p>
          <p>{n.descripcion}</p>
        </div>
      ))}
    </div>
  );
};

export default NoticiasAdmin;
