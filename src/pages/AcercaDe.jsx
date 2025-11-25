// src/pages/AcercaDe.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// 1. COMPONENTE DE ESTILOS (Modificado con 100% de ancho y Modo Oscuro)
const AcercaDeStyles = () => (
  <style>{`
    /* 🖌 Estilo de Body (Modo Claro) */
    body {
      background-color: #ffffff;
      transition: background-color 0.3s ease;
    }

    /* Contenedor principal de la página (Modificado para 100% ancho) */
    .acerca-de-page {
      /* max-width: 800px; <-- Eliminado */
      /* margin: 40px auto; <-- Eliminado */
      min-height: 100vh; /* <-- Añadido para ocupar toda la altura */
      padding: 32px;
      background-color: #ffffff;
      /* border-radius: 12px; <-- Eliminado */
      /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); <-- Eliminado */
      color: #333;
      line-height: 1.6;
    }

    .acerca-de-page h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #222;
      margin-top: 0;
      margin-bottom: 24px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 16px;
    }

    .acerca-de-page h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111;
      margin-top: 32px;
      margin-bottom: 12px;
    }

    .acerca-de-page p,
    .acerca-de-page li {
      font-size: 1rem;
      color: #555;
    }

    .acerca-de-page ul {
      list-style-type: disc;
      padding-left: 24px;
      margin-top: 0;
    }
    
    .acerca-de-page li {
      margin-bottom: 8px;
    }

    /* Sección de contacto */
    .acerca-de-page .contact-info {
      background-color: #f9f9f9;
      border: 1px solid #eee;
      padding: 20px;
      border-radius: 8px;
      margin-top: 16px;
    }
    
    .acerca-de-page .contact-info p {
      margin: 0;
    }

    /* Sección de versión */
    .acerca-de-page .version-info {
      margin-top: 32px;
      text-align: center;
      font-size: 0.85rem;
      color: #aaa;
    }

    /* Botón de volver */
    .btn--back {
      display: inline-block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #555;
      background-color: #f0f0f0;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s;
      margin-bottom: 24px;
    }

    .btn--back:hover {
      background-color: #e5e5e5;
    }

    /* Responsive: Hacemos el padding más pequeño en móviles */
    @media (max-width: 768px) {
      .acerca-de-page {
        padding: 20px;
      }
      .acerca-de-page h1 {
        font-size: 1.75rem;
      }
    }


    /* ======= 🌙 MODO OSCURO (Añadido) ======= */
    @media (prefers-color-scheme: dark) {
      /* 🎨 FONDO Y CONTENEDOR PRINCIPAL */
      body {
        background-color: #1f2937;
      }

      .acerca-de-page {
        background-color: #1f2937;
        color: #d1d5db; /* Color de texto base */
      }

      /* 📊 CABECERA Y TEXTO */
      .acerca-de-page h1 {
        color: #f9fafb;
        border-bottom-color: #374151; /* Borde oscuro */
      }

      .acerca-de-page h3 {
        color: #e5e7eb;
      }

      .acerca-de-page p,
      .acerca-de-page li {
        color: #d1d5db; /* Texto general */
      }
      
      .acerca-de-page a {
          color: #60a5fa; /* Enlaces en modo oscuro */
      }
      
      .acerca-de-page strong {
          color: #f9fafb;
      }

      /* ℹ SECCIONES */
      .acerca-de-page .contact-info {
        background-color: #374151; /* Fondo de sección */
        border-color: #4b5563;
      }
      
      .acerca-de-page .contact-info p {
          color: #d1d5db;
      }

      .acerca-de-page .version-info {
        color: #6b7280; /* Texto atenuado */
      }

      /* ⬅ BOTÓN VOLVER */
      .btn--back {
        background-color: #374151;
        color: #e5e7eb;
      }

      .btn--back:hover {
        background-color: #4b5563;
      }
    }
  `}</style>
);

// 2. COMPONENTE PRINCIPAL DE LA PÁGINA
export default function AcercaDe() {
  const navigate = useNavigate();

  return (
    <>
      {/* Inyectamos los estilos */}
      <AcercaDeStyles />

      {/* Contenido de la página */}
      <main className="acerca-de-page">
        
        {/* Botón para volver al Dashboard */}
        <button onClick={() => navigate("/dashboard")} className="btn--back">
          Volver al Inicio
        </button>

        <h1>Acerca de InfoBank</h1>

        <h3>¿Qué es InfoBank?</h3>
        <p>
          InfoBank es la plataforma centralizada de <strong>Crediservir</strong> diseñada 
          para la gestión del conocimiento y la comunicación interna.
        </p>
        <p>
          Nuestro objetivo es proporcionarte un acceso unificado y sencillo a todos
          los recursos corporativos, materiales de formación, noticias relevantes
          y anuncios importantes. Esta plataforma busca centralizar la
          información para ayudarte en tu desarrollo profesional y mantenerte al
          día con todo lo que sucede en la compañía.
        </p>

        <h3>Características Principales</h3>
        <ul>
          <li>
            <strong>Cursos:</strong> Accede a todos los módulos de capacitación,
            materiales de estudio y evaluaciones.
          </li>
          <li>
            <strong>Noticias:</strong> Mantente informado sobre las últimas
            novedades y comunicados de la empresa.
          </li>
          <li>
            <strong>Muro Informativo:</strong> Ver anuncios importantes,
            publicaciones y actualizaciones del día a día.
          </li>
          <li>
            <strong>Configuración:</strong> Administra las preferencias de tu
            perfil y cuenta.
          </li>
        </ul>

        <h3>Equipo Responsable</h3>
        <p>
          Esta plataforma es administrada y mantenida por 
          <strong> [Luis Villalba,Adrian Ovallos, Julian Osorio y Ramiro Ascanio]</strong>.
        </p>
        
        <div className="contact-info">
          <p>
            Si tienes alguna sugerencia sobre el contenido, nuevas ideas para
            cursos o quieres publicar un anuncio, por favor contacta a:
            <br />
            <strong>Email:</strong> <a href="mailto:[email.responsable@tuempresa.com]">[adrianovallos12@gmail.com]</a>
            <br />
            <strong>Canal Interno:</strong> []
          </p>
        </div>

        <div className="version-info">
          <p>InfoBank v1.0.0</p>
          <p>© {new Date().getFullYear()} </p>
        </div>

      </main>
    </>
  );
}