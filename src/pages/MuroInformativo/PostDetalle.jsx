// src/pages/PostDetalle.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import { useTheme } from "../../context/ThemeContext"; 

// Componente de estilos (sin cambios)
const PostDetalleStyles = () => (
  <style>{`
    .post-detalle-page {
      max-width: 800px;
      margin: 40px auto;
      padding: 24px 32px 32px;
      background-color: var(--color-bg-card, #ffffff); 
      color: var(--color-text-primary, #111); 
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .post-detalle-page.dark {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .btn-volver {
      display: inline-block;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-secondary, #555);
      background-color: var(--color-bg-secondary, #f0f0f0);
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s;
      margin-bottom: 24px;
    }
    .btn-volver:hover {
      background-color: var(--color-bg-hover, #e5e5e5);
    }
    .post-detalle-page h1 {
      font-size: 2.25rem;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .post-meta {
      font-size: 0.9rem;
      color: var(--color-text-secondary, #666);
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-border, #eee);
      padding-bottom: 24px;
    }
    .post-meta p {
      margin: 4px 0;
    }
    .post-meta strong {
      color: var(--color-text-primary, #333);
    }
    .post-contenido {
      font-size: 1.1rem;
      line-height: 1.7;
      color: var(--color-text-primary, #333);
      white-space: pre-wrap; /* Respeta saltos de línea */
    }
    .post-loading, .post-error {
      text-align: center;
      padding: 40px;
      font-size: 1.2rem;
      color: var(--color-text-secondary, #666);
    }
  `}</style>
);


export default function PostDetalle() {
  const { postId } = useParams(); 
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); 
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        // Tu código usa la colección "muro", lo cual está bien
        const docRef = doc(db, "muro", postId); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
          setError(null); 
        } else {
          setError("No se encontró la publicación."); 
        }
      } catch (err) {
        setError("Error al cargar la publicación.");
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]); 

  // --- (Código de Carga / Error - Sin cambios) ---
  if (loading) {
    return (
      <>
        <PostDetalleStyles />
        <div className={`post-loading ${isDarkMode ? "dark" : ""}`}>Cargando...</div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <PostDetalleStyles />
        <div className={`post-error ${isDarkMode ? "dark" : ""}`}>{error}</div>
      </>
    );
  }
  if (!post) {
    return (
      <>
        <PostDetalleStyles />
        <div className={`post-error ${isDarkMode ? "dark" : ""}`}>Publicación no encontrada.</div>
      </>
    );
  }

  // --- (Formateo de Fecha - Sin cambios) ---
  const fechaFormateada = post.fecha?.toDate 
    ? post.fecha.toDate().toLocaleString("es-ES", {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) 
    : "Fecha no disponible";

  return (
    <>
      <PostDetalleStyles />
      <main className={`post-detalle-page ${isDarkMode ? "dark" : ""}`}>
        
        <button onClick={() => navigate(-1)} className="btn-volver">
          &larr; Volver al Muro
        </button>

        <h1>{post.titulo || "Sin Título"}</h1>
        
        <div className="post-meta">
          <p>Publicado por: <strong>{post.autor || "Administración"}</strong></p>
          <p>Fecha: {fechaFormateada}</p>
          {post.categoria && <p>Categoría: {post.categoria}</p>}
        </div>
        
        {/* ⭐️ --- CORRECCIÓN FINAL --- ⭐️ */}
        {/* Cambiamos "post.mensaje" por "post.descripcion" */}
        <div className="post-contenido">
          {post.descripcion}
        </div>

      </main>
    </>
  );
}