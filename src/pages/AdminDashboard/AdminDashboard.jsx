import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  collection, addDoc, onSnapshot, setDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, sendEmailVerification, signOut,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import Calendario from "../Calendario/Calendario"; // ← AQUÍ
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ImageUploader from "../../components/ImageUploadeer";



export default function AdminDashboard() {
  const navigate = useNavigate();

  // ===== Tabs
  const [tab, setTab] = useState("cursos");

  // ===== Cursos
  const [cursos, setCursos] = useState([]);
  const [editandoCurso, setEditandoCurso] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [imagen, setImagen] = useState("");
  const [preview, setPreview] = useState("");
  const [cupos, setCupos] = useState("");
  const [archivoEnlace, setArchivoEnlace] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [enlaceEvaluacion, setEnlaceEvaluacion] = useState("");

  // ===== Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoArea, setNuevoArea] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("usuario");
  const [registrando, setRegistrando] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [fotoEmpleado, setFotoEmpleado] = useState("");

  // ===== Mensajes / Notificaciones
  const [mensajes, setMensajes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [respuesta, setRespuesta] = useState("");
  // Función para ELIMINAR Notificación
const eliminarNoti = async (n) => {
  const result = await Swal.fire({
    title: "¿Eliminar notificación?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar"
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "notificaciones", n.id));
      Swal.fire("Eliminado", "La notificación ha sido borrada.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  }
};

  //===== Noticias
  const [tituloNoticia, setTituloNoticia] = useState("");
  const [contenidoNoticia, setContenidoNoticia] = useState("");
  const [noticias, setNoticias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [autor, setAutor] = useState("");
  const [fechaPublicacion, setFechaPublicacion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [previewNoticia, setPreviewNoticia] = useState("");
  const [editarNoticiaId, setEditarNoticiaId] = useState(null);
  const [editando, setEditando] = useState(false); // Boolean for edit mode

  // Estado para el acordeón de noticias
  const [idExpandido, setIdExpandido] = useState(null);

  const handleCardClick = (id) => {
    setIdExpandido(prev => (prev === id ? null : id));
  };


  // 🔹 Categorías predefinidas para el acordeón
  const categoriasBanco = [
    "Corporativas",
    "Productos y Servicios",
    "Educación Financiera",
    "Tecnología e Innovación",
    "Recursos Humanos",
    "Comunicados Urgentes",
    "Eventos y Promociones",
  ];

  // 🔹 Estado del acordeón de categorías
  const [mostrarAcordeon, setMostrarAcordeon] = useState(false);





  //===== Muro informativo
  const [tituloMuro, setTituloMuro] = useState("");
  const [contenidoMuro, setContenidoMuro] = useState("");
  const [muroInformativo, setMuroInformativo] = useState([]);
  const [editarMuroId, setEditarMuroId] = useState(null);
  const [editandoMuro, setEditandoMuro] = useState(false); // Boolean for edit mode
  const [visualMuro, setVisualMuro] = useState("lista"); // "lista" o "formulario"
  const [categoriaMuro, setCategoriaMuro] = useState("");
  const [mostrarAcordeonMuro, setMostrarAcordeonMuro] = useState(false);
  const [imagenurl, setImagenurl] = useState("");

  const categoriasMuro = [
    "Anuncios Generales",
    "Eventos Internos",
    "Actualizaciones Operativas",
    "Reconocimientos y Logros",
    "Salud y Bienestar",
    "Capacitaciones y Desarrollo",
  ];

  // ===== Listeners
  useEffect(() => {
    const unsubNoticias = onSnapshot(
      query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc")),
      (snap) => {
        setNoticias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubMuroInformativo = onSnapshot(collection(db, "muro"), (snap) => {
      setMuroInformativo(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubNoticias();
      unsubMuroInformativo();
    };
  }, []);


  useEffect(() => {
    const unsubCursos = onSnapshot(collection(db, "cursos"), (snap) => {
      setCursos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubMensajes = onSnapshot(
      query(collection(db, "mensajes"), orderBy("creadoEn", "desc")),
      (snap) => setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubNotis = onSnapshot(
      query(collection(db, "notificaciones"), orderBy("creadoEn", "desc")),
      (snap) => setNotificaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubCursos();
      unsubUsuarios();
      unsubMensajes();
      unsubNotis();

    };
  }, []);

  // ===== Stats
  const usuariosActivos = usuarios.filter((u) => u.estado === "Activo").length;
  const mensajesPendientes = mensajes.filter((m) => m.estado === "pendiente").length;
  const notificacionesNuevas = notificaciones.filter((n) => !n.leida).length;
  const noticiasPublicadas = noticias.length;
  const muroInformativoPublicados = muroInformativo.length;



  // 📌 Crear noticia
  const publicarNoticia = async () => {
    if (!tituloNoticia || !contenidoNoticia) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    // if (imagenUrl && !isValidUrl(imagenUrl)) {
    //   Swal.fire("URL de imagen no válida", "Debe comenzar con http:// o https://", "warning");
    //   return;
    // }

    try {
      await addDoc(collection(db, "noticias"), {
        titulo: tituloNoticia,
        descripcion: contenidoNoticia,
        imagen: imagenUrl || "",
        categoria: categoria || "General",
        autor: autor || "Administrador",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : serverTimestamp(),
        creadaEn: serverTimestamp(),
      });

      Swal.fire("Publicado", "La noticia se publicó correctamente", "success");
      limpiarFormulario();
    } catch (error) {
      console.error("Error al publicar noticia:", error);
      Swal.fire("Error", "No se pudo publicar la noticia", "error");
    }
  };

  // 📌 Editar noticia
  const editarNoticia = (n) => {
    setEditando(true);
    setEditarNoticiaId(n.id);
    setTituloNoticia(n.titulo || "");
    setContenidoNoticia(n.descripcion || n.contenido || "");
    setImagenUrl(n.imagen || "");
    setPreviewNoticia(n.imagen || "");
    setCategoria(n.categoria || "");
    setAutor(n.autor || "Administrador");
    setFechaPublicacion(
      n.fechaPublicacion?.toDate
        ? n.fechaPublicacion.toDate().toISOString().split("T")[0]
        : ""
    );

    setTimeout(() => {
      const formElement = document.getElementById("form-noticia");
      if (formElement) {
        formElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);
  };


  // 📌 Actualizar noticia
  const actualizarNoticia = async () => {
    if (!editarNoticiaId) return;

    if (!tituloNoticia || !contenidoNoticia) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    // if (imagenUrl && !isValidUrl(imagenUrl)) {
    //   Swal.fire("URL de imagen no válida", "Debe comenzar con http:// o https://", "warning");
    //   return;
    // }

    try {
      await updateDoc(doc(db, "noticias", editarNoticiaId), {
        titulo: tituloNoticia,
        descripcion: contenidoNoticia,
        imagen: imagenUrl || "",
        categoria: categoria || "General",
        autor: autor || "Administrador",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : serverTimestamp(),
      });

      Swal.fire("Actualizada", "La noticia fue actualizada correctamente", "success");
      limpiarFormulario();
    } catch (error) {
      console.error("Error al actualizar noticia:", error);
      Swal.fire("Error", "No se pudo actualizar la noticia", "error");
    }
  };

  // 📌 Eliminar noticia
  const eliminarNoticia = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar noticia?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "noticias", id));
        Swal.fire("Eliminada", "La noticia fue eliminada", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar la noticia", "error");
      }
    }
  };

  // 📌 Cancelar edición / limpiar formulario
  const limpiarFormulario = () => {
    setTituloNoticia("");
    setContenidoNoticia("");
    setImagenUrl("");
    setPreviewNoticia("");
    setCategoria("");
    setAutor("");
    setFechaPublicacion("");
    setEditando(false);
    setEditarNoticiaId(null);
    setMostrarAcordeon(false);
  };

  const cancelarEdicion = () => limpiarFormulario();


  // muro informativo
  // 📌 Publicar nuevo mensaje
  const publicarMuroInformativo = async () => {
    if (!tituloMuro || !contenidoMuro) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "muro"), {
        titulo: tituloMuro,
        descripcion: contenidoMuro,
        categoria: categoriaMuro || "Anuncios Generales",
        fecha: serverTimestamp(),
        autorNombre: auth.currentUser?.displayName || "Administrador",
        autorRol: "Administrador",
        imagenurl: imagenurl || "",
      });

      Swal.fire("Publicado", "El mensaje se publicó correctamente", "success");
      limpiarFormularioMuro();
    } catch (error) {
      console.error("Error al publicar mensaje:", error);
      Swal.fire("Error", "No se pudo publicar el mensaje", "error");
    }
  };

  // 📌 Editar mensaje
  const editarMuroInformativo = (m) => {
    setEditandoMuro(true);
    setEditarMuroId(m.id);
    setTituloMuro(m.titulo);
    setContenidoMuro(m.descripcion);
    setVisualMuro("formulario");
    setCategoriaMuro(m.categoria || "Anuncios Generales");
    setImagenurl(m.imagenurl || "");
  };

  // 📌 Actualizar mensaje
  const actualizarMuroInformativo = async () => {
    if (!editarMuroId) return;

    if (!tituloMuro || !contenidoMuro || !categoriaMuro) {
      Swal.fire("Campos incompletos", "Ingresa título, contenido y categoría", "warning");
      return;
    }

    try {
      await updateDoc(doc(db, "muro", editarMuroId), {
        titulo: tituloMuro,
        descripcion: contenidoMuro,
        categoria: categoriaMuro || "Anuncios Generales",
        fechaActualizada: serverTimestamp(),
        autorNombre: auth.currentUser?.displayName || "Administrador",
        autorRol: "Administrador",
        imagenurl: imagenurl || "",
      });

      Swal.fire("Actualizado", "El mensaje fue actualizado correctamente", "success");
      limpiarFormularioMuro();
    } catch (error) {
      console.error("Error al actualizar mensaje:", error);
      Swal.fire("Error", "No se pudo actualizar el mensaje", "error");
    }
  };

  // 📌 Eliminar mensaje
  const eliminarMuroInformativo = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar mensaje?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "muro", id));
        Swal.fire("Eliminado", "El mensaje fue eliminado", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar el mensaje", "error");
      }
    }
  };

  // 📌 Limpiar formulario
  const limpiarFormularioMuro = () => {
    setTituloMuro("");
    setContenidoMuro("");
    setEditandoMuro(false);
    setEditarMuroId(null);
    setVisualMuro("lista");
    setCategoriaMuro("");
    setMostrarAcordeonMuro("false");
    setImagenurl("");
  };



 // ===== Cursos CRUD
  const handleGuardarCurso = async (e) => {
    e.preventDefault();
    // Agregamos videoUrl a la validación si quieres que sea obligatorio (opcional)
    if (!nombre || !descripcion || !duracion || !fechaLimite || !cupos) {
      return Swal.fire("Campos incompletos", "Completa los campos obligatorios.", "warning");
    }

    try {
      const payload = {
        nombre,
        descripcion,
        duracion,
        fechaLimite,
        imagen,
        archivoEnlace: archivoEnlace ? archivoEnlace.trim() : "",
        
        // 👇 AQUÍ ESTABA LO QUE FALTABA 👇
        videoUrl: videoUrl ? videoUrl.trim() : "", 
        enlaceEvaluacion: enlaceEvaluacion ? enlaceEvaluacion.trim() : "",
        // -------------------------------

        cupos: Number(cupos),
      };

      if (editandoCurso) {
        await updateDoc(doc(db, "cursos", editandoCurso.id), payload);
        Swal.fire("✅ Actualizado", "Curso actualizado con éxito", "success");
      } else {
        await addDoc(collection(db, "cursos"), {
          ...payload,
          inscritos: 0,
          createdAt: serverTimestamp(),
          estado: "activo" // Aseguramos que se cree como activo
        });
        Swal.fire("✅ Agregado", "Curso creado con éxito", "success");
      }
      limpiarFormularioCurso();
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error", "No se pudo guardar el curso", "error");
    }
  };
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el buscador

// Lógica de filtrado optimizada (para no repetirla en el HTML)
const usuariosFiltrados = usuarios.filter((u) => {
  if (!searchTerm) return true; // Si no hay búsqueda, muestra todos
  
  const term = searchTerm.toLowerCase();
  // Usamos "|| ''" para evitar errores si algún campo viene vacío de la base de datos
  return (
    (u.nombre || "").toLowerCase().includes(term) ||
    (u.apellido || "").toLowerCase().includes(term) ||
    (u.email || "").toLowerCase().includes(term) ||
    (u.areaTrabajo || "").toLowerCase().includes(term)
  );
});

  const handleEditarCurso = (c) => {
    setEditandoCurso(c);
    setNombre(c.nombre);
    setDescripcion(c.descripcion);
    setDuracion(c.duracion);
    setFechaLimite(c.fechaLimite);
    setImagen(c.imagen || "");
    setPreview(c.imagen || "");
    setCupos(c.cupos || "");
    setArchivoEnlace(c.archivoEnlace || "");

    setTimeout(() => {
      document.getElementById("form-curso").scrollIntoView({ behavior: "smooth" });
    }, 50);
  };
// Estado para controlar qué lista vemos (Activos vs Archivados)
  const [verArchivados, setVerArchivados] = useState(false);

  // Función MEJORADA para Archivar/Restaurar con SweetAlert2
  const handleArchivarCurso = async (curso) => {
    const nuevoEstado = !curso.archivado; // Si es true pasa a false, y viceversa
    
    // Configuración de la alerta
    const result = await Swal.fire({
      title: nuevoEstado ? '¿Archivar Curso?' : '¿Restaurar curso?',
      text: nuevoEstado 
        ? `El curso "${curso.nombre}" se ocultará de la lista principal.`
        : `El curso "${curso.nombre}"volverá a aparecer en la lista principal. `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? '#28a745' : '#f39c12', // Verde para restaurar, Naranja para archivar
      cancelButtonColor: '#d33',
      confirmButtonText: nuevoEstado ? 'Sí' : 'Sí, archivar',
      cancelButtonText: 'Cancelar'
    });

    // Solo procedemos si el usuario dio click en "Sí"
    if (result.isConfirmed) {
      try {
        const cursoRef = doc(db, "cursos", curso.id);
        await updateDoc(cursoRef, {
          archivado: nuevoEstado
        });
        
        // Alerta de éxito
        Swal.fire(
          nuevoEstado ? '¡Archivado!' : '¡Restaurado!',
          nuevoEstado ? 'El curso ha sido archivado.' : 'El curso está visible nuevamente.' ,
          'success'
        );
      } catch (error) {
        console.error("Error al actualizar estado:", error);
        Swal.fire('Error', 'Hubo un problema al actualizar el curso.', 'error');
      }
    }
  };
  
  const handleEliminarCurso = async (id) => {
    const ok = await Swal.fire({ title: "¿Eliminar curso?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "cursos", id));
    Swal.fire("🗑️ Eliminado", "", "success");
  };

  const limpiarFormularioCurso = () => {
    setEditandoCurso(null);
    setNombre("");
    setDescripcion("");
    setDuracion("");
    setFechaLimite("");
    setImagen("");
    setCupos("");
    setPreview("");
    setArchivoEnlace("");
  };

  const handlePreview = (e) => {
    setImagen(e.target.value);
    setPreview(e.target.value);
  };

  // ===== Usuarios CRUD =====
  const handleRegistrarUsuario = async (e) => {
    e.preventDefault();
    // Tu validación original de campos vacíos
    if (!nuevoNombre || !nuevoApellido || !nuevoEmail || !nuevoArea || !nuevoPassword || !confirmPassword) {
      return Swal.fire("Campos incompletos", "Completa todos los campos", "warning");
    }

    // --- ✅ VALIDACIÓN DE CONTRASEÑA FUERTE ---
    if (nuevoPassword.length < 8) {
      return Swal.fire("Contraseña débil", "Debe tener al menos 8 caracteres.", "warning");
    }
    if (nuevoPassword !== confirmPassword) {
      // Tu validación original de coincidencia
      return Swal.fire("No coinciden", "Revisa las contraseñas", "warning");
    }
    // Añadimos las validaciones faltantes
    if (!/[a-z]/.test(nuevoPassword)) {
      return Swal.fire("Contraseña débil", "Debe incluir al menos una letra minúscula (a-z).", "warning");
    }
    if (!/[A-Z]/.test(nuevoPassword)) {
      return Swal.fire("Contraseña débil", "Debe incluir al menos una letra MAYÚSCULA (A-Z).", "warning");
    }
    if (!/[0-9]/.test(nuevoPassword)) {
      return Swal.fire("Contraseña débil", "Debe incluir al menos un número (0-9).", "warning");
    }
    // ¡ESTA ES LA LÍNEA CLAVE PARA CARACTERES ESPECIALES!
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(nuevoPassword)) {
      return Swal.fire("Contraseña débil", "Debe incluir al menos un carácter especial (ej: !@#$%).", "warning");
    }
    // --- FIN DE VALIDACIÓN ---

    // Tu lógica original para crear el usuario
    try {
      setRegistrando(true);
      // 1. Creamos en Auth
      const cred = await createUserWithEmailAndPassword(auth, nuevoEmail, nuevoPassword);
      const user = cred.user;

      // 2. Creamos en "usuarios" (tu colección original)
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: nuevoNombre,
        apellido: nuevoApellido,
        email: nuevoEmail,
        areaTrabajo: nuevoArea,
        rol: nuevoRol, // Usas el estado nuevoRol
        estado: "Activo", // Tu estado original "Activo"
        cursosInscritos: 0,
        ultimoAcceso: null,
        createdAt: serverTimestamp(),
        fotoEmpleado: fotoEmpleado || "",
      });

      // 3. ✅ SINCRO: Creamos en "roles" para el Login y las Reglas
      await setDoc(doc(db, "roles", user.uid), {
        rol: nuevoRol, // Mismo rol que en 'usuarios'
        estado: "activo", // Estado en minúscula para las reglas
      });

      // Tu lógica original de verificación de email
      try {
        await sendEmailVerification(user);
      } catch (emailError) {
        console.warn("No se pudo enviar email de verificación", emailError); // Usamos warn en lugar de catch vacío
      }

      // Tu mensaje original de éxito y limpieza de formulario
      Swal.fire("✅ Usuario creado", "El usuario y sus permisos han sido creados.", "success");
      setNuevoNombre("");
      setNuevoApellido("");
      setNuevoEmail("");
      setNuevoArea("");
      setNuevoPassword("");
      setConfirmPassword("");
      setNuevoRol("usuario"); // Reseteas el rol a 'usuario'
      setFotoEmpleado("");
    } catch (err) {
      // Tu manejo de errores original
      if (err.code === 'auth/email-already-in-use') {
        Swal.fire("❌ Error", "Este correo electrónico ya está registrado.", "error");
      } else {
        console.error("Error registrando usuario:", err); // Añadimos log para depuración
        Swal.fire("❌ Error", err.message || "No se pudo registrar", "error");
      }
    } finally {
      // Tu finally original
      setRegistrando(false);
    }
  };

  const handleToggleBloqueo = async (u) => {
    const nuevoEstado = u.estado === "Inactivo" ? "Activo" : "Inactivo";

    await updateDoc(doc(db, "usuarios", u.id), {
      estado: nuevoEstado,
      bloqueadoEn: nuevoEstado === "Inactivo" ? new Date() : null
    });

    // El usuario será expulsado automáticamente en < 2 segundos
  };

  const handleEliminarUsuario = async (u) => {
    const ok = await Swal.fire({ title: `¿Eliminar a ${u.nombre}?`, icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "usuarios", u.id));
    Swal.fire("🗑️ Eliminado", "", "success");
  };

  // SCROLL AL MODAL DE EDICIÓN DE USUARIO
  const startEditUser = (u) => {
    setEditingUser({ ...u });

    setTimeout(() => {
      const formElement = document.getElementById("edit-user-form");
      if (formElement) {
        formElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);
  };
  const handleEditChange = (e) => setEditingUser({ ...editingUser, [e.target.name]: e.target.value });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
// --- FUNCIÓN EXPORTAR A EXCEL ---
  const exportarExcel = () => {
    // 1. Formateamos los datos para que queden bonitos en el Excel
    const dataToExport = usuariosFiltrados.map(u => ({
      Nombre: u.nombre,
      Apellido: u.apellido,
      Email: u.email,
      Area: u.areaTrabajo || "N/A",
      Rol: u.rol,
      Estado: u.estado,
      Ultimo_Acceso: u.ultimoAcceso 
        ? u.ultimoAcceso.toDate().toLocaleString("es-CO") 
        : "Nunca"
    }));

    // 2. Crear hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

    // 3. Descargar archivo
    XLSX.writeFile(workbook, "Lista_Usuarios_InfoBank.xlsx");
  };

  // --- FUNCIÓN EXPORTAR A PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF();

    // Título del PDF
    doc.text("Reporte de Usuarios - InfoBank", 20, 10);

    // Definir columnas y filas
    const columns = ["Nombre", "Apellido", "Email", "Área", "Rol", "Estado"];
    const rows = usuariosFiltrados.map(u => [
      u.nombre,
      u.apellido,
      u.email,
      u.areaTrabajo || "N/A",
      u.rol,
      u.estado
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 20, // Empieza un poco más abajo del título
    });

    // Descargar
    doc.save("Reporte_Usuarios.pdf");
  };


  const saveEditUser = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "usuarios", editingUser.id), {
      nombre: editingUser.nombre,
      apellido: editingUser.apellido || "",
      email: editingUser.email,
      areaTrabajo: editingUser.areaTrabajo || "",
      rol: editingUser.rol,
      estado: editingUser.estado,
      fotoEmpleado: editingUser.fotoEmpleado || "",
    });
    setEditingUser(null);
    Swal.fire("✅ Actualizado", "", "success");
  };

  // Dentro de AdminDashboard.js, reemplazar la función responderMensaje y la sección de mensajería

  // ===== Mensajes (Admin)
  const marcarLeido = async (m) => {
    await updateDoc(doc(db, "mensajes", m.id), { estado: "leído" });
  };

  const eliminarMensaje = async (m) => {
    const ok = await Swal.fire({
      title: "¿Eliminar mensaje?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "mensajes", m.id));
  };

  const responderMensaje = async (m) => {
    const { value: texto } = await Swal.fire({
      title: `Responder: ${m.asunto}`,
      input: "textarea",
      inputPlaceholder: "Escribe tu respuesta…",
      showCancelButton: true,
      confirmButtonText: "Enviar respuesta",
    });
    if (!texto) return;
    try {
      await addDoc(collection(db, "mensajes_respuestas"), {
        mensajeId: m.id,
        respuesta: texto,
        respondidoPor: auth.currentUser?.email || "admin",
        remitente: auth.currentUser?.email || "admin",
        respondidoEn: serverTimestamp(),
      });
      await updateDoc(doc(db, "mensajes", m.id), { estado: "respondido", respondidoEn: serverTimestamp(), respuesta: texto });
      Swal.fire("✅ Respuesta enviada", "", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo enviar la respuesta", "error");
    }
  };

  // Añadir carga de respuestas para mostrar el hilo en el admin
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    const mensajesQuery = query(
      collection(db, "mensajes"),
      orderBy("creadoEn", "desc")
    );

    const unsubscribeMensajes = onSnapshot(mensajesQuery, (snapshot) => {
      const mensajesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMensajes(mensajesData);

      // Cargar respuestas para cada mensaje
      mensajesData.forEach((mensaje) => {
        const respuestasQuery = query(
          collection(db, "mensajes_respuestas"),
          where("mensajeId", "==", mensaje.id),
          orderBy("respondidoEn", "asc")
        );
        onSnapshot(respuestasQuery, (resSnapshot) => {
          const respuestasData = resSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRespuestas((prev) => ({
            ...prev,
            [mensaje.id]: respuestasData,
          }));
        });
      });
    });

    return unsubscribeMensajes;
  }, []);

  // Sección de mensajería en el render
  {
    tab === "mensajes" && (
      <section className="users">
        <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Mensajería</h2>
        </div>

        {mensajes.length === 0 && <p>No hay mensajes.</p>}

        {mensajes.map((m) => (
          <div key={m.id} className="msg-card">
            <div className="msg-main">
              <div className="msg-top">
                <strong>{m.asunto}</strong>
                {m.estado === "pendiente" ? (
                  <span className="badge badge--warn">Pendiente</span>
                ) : (
                  <span className="badge">Respondido</span>
                )}
              </div>
              <p className="msg-content"><strong>{m.remitente}:</strong> {m.contenido}</p>
              <small>
                Enviado el: {m.creadoEn?.toDate?.().toLocaleString?.() || "—"}
              </small>
              <div className="respuesta">
                {(respuestas[m.id] || []).map((resp, index) => (
                  <div key={index} className="respuesta-item">
                    <p><strong>{resp.respondidoPor}:</strong> {resp.respuesta}</p>
                    <small>
                      Respondido el:{" "}
                      {resp.respondidoEn?.toDate?.().toLocaleString?.() || "—"}
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className="msg-actions">
              {m.estado === "pendiente" && (
                <button className="btn btn--save" onClick={() => marcarLeido(m)}>Marcar leído</button>
              )}
              <button className="btn btn--edit" onClick={() => responderMensaje(m)}>Responder</button>
              <button className="btn btn--delete" onClick={() => eliminarMensaje(m)}>Eliminar</button>
            </div>
          </div>
        ))}
      </section>
    )
  }

  // ===== Notificaciones (Admin)
  const marcarNotiLeida = async (n) => {
    await updateDoc(doc(db, "notificaciones", n.id), { leida: true });
  };
  const crearNotiDemo = async () => {
    await addDoc(collection(db, "notificaciones"), {
      titulo: "Nueva inscripción",
      descripcion: "Un usuario se inscribió a un curso.",
      tipo: "curso",
      leida: false,
      creadoEn: serverTimestamp(),
    });
    Swal.fire("🔔 Notificación creada (demo)", "", "success");
  };

  // ===== Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="admin">
      {/* HEADER */}
      <header className="admin__header" style={{ borderBottom: "3px solid #ef4444", paddingBottom: 8 }}>
        <h1>⚙️ Panel de Administración</h1>
        <button className="btn btn--logout" onClick={handleLogout}>
          🔒 Cerrar sesión
        </button>
      </header>

      {/* STATS */}
      <section className="stats">
        <div className="stat stat--blue">
          <div className="stat__icon">👥</div>
          <div>
            <h3>Total Usuarios</h3>
            <p className="stat__value">{usuarios.length}</p>
            <span>{usuariosActivos} activos</span>
          </div>
        </div>
        <div className="stat stat--green">
          <div className="stat__icon">📘</div>
          <div>
            <h3>Total Cursos</h3>
            <p className="stat__value">{cursos.length}</p>
            <span>Registrados en el sistema</span>
          </div>
        </div>
        <div className="stat stat--purple">
          <div className="stat__icon">📨</div>
          <div>
            <h3>Mensajes</h3>
            <p className="stat__value">{mensajes.length}</p>
            <span>Pendientes: {mensajesPendientes}</span>
          </div>
        </div>
        <div className="stat stat--orange">
          <div className="stat__icon">🔔</div>
          <div>
            <h3>Notificaciones</h3>
            <p className="stat__value">{notificaciones.length}</p>
            <span>Nuevas: {notificacionesNuevas}</span>
          </div>
        </div>
        <div className="stat stat--red">
          <div className="stat__icon">📰</div>
          <div>
            <h3>Noticias</h3>
            <p className="stat__value">{noticias.length}</p>
            <span>Publicadas</span>
          </div>
        </div>
        <div className="stat stat--yellow">
          <div className="stat__icon">📅</div>
          <div>
            <h3>Calendario</h3>
            <span>Evento publicados</span>
          </div>
        </div>
        <div className="stat stat--teal">
          <div className="stat__icon">📋</div>
          <div>
            <h3>Muro Informativo</h3>
            <p className="stat__value">{muroInformativo.length}</p>
            <span>Mensajes publicados</span>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "cursos" ? "active" : ""}`} onClick={() => setTab("cursos")}>
          Gestión de Cursos
        </button>
        <button className={`tab-btn ${tab === "usuarios" ? "active" : ""}`} onClick={() => setTab("usuarios")}>
          Gestión de Usuarios
        </button>
        <button className={`tab-btn ${tab === "mensajes" ? "active" : ""}`} onClick={() => setTab("mensajes")}>
          Mensajería {mensajesPendientes > 0 && <span className="badge--count">{mensajesPendientes}</span>}
        </button>
        <button className={`tab-btn ${tab === "notis" ? "active" : ""}`} onClick={() => setTab("notis")}>
          Notificaciones {notificacionesNuevas > 0 && <span className="badge--count">{notificacionesNuevas}</span>}
        </button>
        <button className={`tab-btn ${tab === "noticias" ? "active" : ""}`} onClick={() => setTab("noticias")}>
          Noticias
        </button>
        <button className={`tab-btn ${tab === "calendario" ? "active" : ""}`} onClick={() => setTab("calendario")}>
          Calendario
        </button>
        <button className={`tab-btn ${tab === "muro" ? "active" : ""}`} onClick={() => setTab("muro")}>
          Muro Informativo
        </button>
      </div>
     


     <div className="tab-content">
        {/* ===== CURSOS ===== */}
        {tab === "cursos" && (
          <section className="courses">
            <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <h2>Cursos</h2>
              
              <button
                className="btn btn--add"
                onClick={() => document.getElementById("form-curso").scrollIntoView({ behavior: "smooth" })}
              >
                Agregar Curso
              </button>
            </div>

            {/* --- BARRA DE BÚSQUEDA + FILTRO DE ARCHIVO --- */}
            <div style={{ margin: "15px 0", display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar curso por nombre..."
                value={busqueda} // Asegúrate de usar 'busqueda' o 'searchTerm' según tengas definido
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
              
              {/* CHECKBOX PARA VER ARCHIVADOS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#555', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={verArchivados} 
                    onChange={(e) => setVerArchivados(e.target.checked)} 
                  />
                  📂 Ver cursos archivados
                </label>
              </div>
            </div>
            {/* -------------------------------- */}

            <div className="course-list">
              {cursos
                .filter((c) => {
                    // 1. Filtro por Nombre
                    const matchNombre = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
                    // 2. Filtro por Estado (Si verArchivados es true, busca los true. Si es false, busca los false/undefined)
                    const matchEstado = verArchivados ? c.archivado === true : !c.archivado;
                    
                    return matchNombre && matchEstado;
                })
                .map((c) => (
                <div key={c.id} className="course-card" style={{ borderLeft: verArchivados ? '5px solid #999' : '5px solid #28a745' }}>
                  <div>
                    <h3>
                        {c.nombre} 
                        {verArchivados && <span style={{fontSize: '0.7em', color: '#777', marginLeft: '8px'}}>(Archivado)</span>}
                    </h3>
                    <p>{c.descripcion}</p>
                    <small>Duración: {c.duracion}</small><br />
                    <small>Fecha Límite: {c.fechaLimite}</small><br />
                    <small>Cupos: {c.inscritos || 0} / {c.cupos}</small><br />

                    {c.enlaceEvaluacion && <small>Enlace de Evaluación: <a href={c.enlaceEvaluacion} target="_blank" rel="noopener noreferrer">Ver Evaluación</a></small>}
                  </div>

                  <div className="course-actions">
                    {/* BOTÓN EDITAR */}
                    <button className="btn btn--edit" onClick={() => handleEditarCurso(c)}>✏️ Editar</button>

                    {/* --- NUEVO: BOTÓN ARCHIVAR / RESTAURAR --- */}
                    <button 
                        onClick={() => handleArchivarCurso(c)}
                        style={{ 
                            backgroundColor: verArchivados ? '#28a745' : '#f39c12', 
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            margin: '0 5px'
                        }}
                        title={verArchivados ? "Restaurar a la lista principal" : "Ocultar curso"}
                    >
                        {verArchivados ? "♻️ Restaurar" : "📂 Archivar"}
                    </button>
                    {/* ----------------------------------------- */}

                    {/* BOTÓN ELIMINAR */}
                    <button className="btn btn--delete" onClick={() => handleEliminarCurso(c.id)}>🗑️ Eliminar</button>
                  </div>
                </div>
              ))}
              
              {/* Mensaje si no hay resultados */}
              {cursos.filter(c => verArchivados ? c.archivado : !c.archivado).length === 0 && (
                <p style={{ width: '100%', textAlign: 'center', color: '#666', marginTop: '20px' }}>
                    {verArchivados 
                        ? "No hay cursos en el archivo." 
                        : "No se encontraron cursos activos."}
                </p>
              )}
            </div>

            <section className="add-course" id="form-curso">
              <h2>{editandoCurso ? "Editar curso" : "Agregar nuevo curso"}</h2>
              <form onSubmit={handleGuardarCurso} className="form">
                <input type="text" placeholder="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} required/>
                <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required/>
                <input type="text" placeholder="Duración" value={duracion} onChange={(e) => setDuracion(e.target.value)} required/>
                <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} required/>
                
                {/* Inputs de imagen y video */}
                <input type="text" placeholder="URL de imagen" value={imagen} onChange={handlePreview} />
                {preview && <img src={preview} alt="Vista previa" style={{ width: 200, borderRadius: 8, marginTop: 10 }} />}
                
                <input type="text" placeholder="Enlace del archivo (opcional)" value={archivoEnlace} onChange={(e) => setArchivoEnlace(e.target.value)} />
                <input
                  type="text"
                  placeholder="Enlace de Evaluación (opcional)"
                  value={enlaceEvaluacion}
                  onChange={(e) => setEnlaceEvaluacion(e.target.value)}
                />
                <input type="text" placeholder="URL del video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required />
                <input type="number" placeholder="Cupos disponibles" value={cupos} onChange={(e) => setCupos(e.target.value)} min="1" required/>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn--save">
                    {editandoCurso ? "Actualizar curso" : "Guardar curso"}
                  </button>
                  {editandoCurso && (
                    <button type="button" className="btn btn--cancel" onClick={limpiarFormularioCurso}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>
          </section>
        )}
      </div>
       {/* ===== USUARIOS ===== */}
      {tab === "usuarios" && (
        <section className="users">
          <h2>Gestión de Usuarios</h2>

          {/* --- FORMULARIO DE REGISTRO --- */}
          <form onSubmit={handleRegistrarUsuario} className="register-card">
            <div className="register-head">
              <h3>Registro de Empleado</h3>
              <p className="reg-subtitle">Completa tu información para crear tu cuenta</p>
            </div>
            <div className="form-row two">
              <div className="field">
                <label>Nombre</label>
                <div className="input-with-icon">
                  <span className="icon">👤</span>
                  <input type="text" placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Apellido</label>
                <div className="input-with-icon">
                  <span className="icon">👤</span>
                  <input type="text" placeholder="Apellido" value={nuevoApellido} onChange={(e) => setNuevoApellido(e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="field">
              <label>Correo Electrónico</label>
              <div className="input-with-icon">
                <span className="icon">✉️</span>
                <input type="email" placeholder="tu.email@infobank.com" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Área de Trabajo</label>
              <div className="input-with-icon">
                <span className="icon">🏢</span>
                <select value={nuevoArea} onChange={(e) => setNuevoArea(e.target.value)} required>
                  <option value="">Selecciona área</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Atención al Cliente">Atención al Cliente</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                </select>
              </div>
            </div>
            <div style={{ margin: "20px 0" }}>
                    <label>Foto del empleado (opcional)</label>
                    <ImageUploader
                      currentImage={fotoEmpleado}
                      onImageUpload={(url) => setFotoEmpleado(url)}
                    />
                  </div>
            <div className="field">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input type="password" placeholder="Mínimo 8 chars, Mayús, núm, especial (!@#$)" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Confirmar Contraseña</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input type="password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <p className="helper">Contraseña: 8+ caracteres, 1 Mayúscula, 1 minúscula, 1 número, 1 símbolo (!@#$).</p>
            <button type="submit" className="btn btn--primary" disabled={registrando}>
              {registrando ? "Creando…" : "Crear Cuenta"}
            </button>
          </form>

          {/* --- FORMULARIO DE EDICIÓN (MODAL) --- */}
          {editingUser && (
            <div className="modal-backdrop">
              <form id="edit-user-form" onSubmit={saveEditUser} className="user-form modal-content">
                <h3>✏️ Editar usuario</h3>
                <label>Nombre</label>
                <input name="nombre" type="text" value={editingUser.nombre || ""} onChange={handleEditChange} required />
                <label>Apellido</label>
                <input name="apellido" type="text" value={editingUser.apellido || ""} onChange={handleEditChange} required />
                <label>Email</label>
                <input name="email" type="email" value={editingUser.email || ""} onChange={handleEditChange} required />
                <label>Área de Trabajo</label>
                <input name="areaTrabajo" type="text" value={editingUser.areaTrabajo || ""} onChange={handleEditChange} required />
                <label>Rol</label>
                <select name="rol" value={editingUser.rol || "usuario"} onChange={handleEditChange} required>
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <div style={{ margin: "20px 0" }}>
                    <label>Foto del empleado (opcional)</label>
                    <ImageUploader
                      currentImage={fotoEmpleado}
                      onImageUpload={(url) => setFotoEmpleado(url)}
                    />
                  </div>
                <label>Estado</label>
                <select name="estado" value={editingUser.estado || "Activo"} onChange={handleEditChange} required>
                  <option value="Activo">Activo</option>
                  <option value="Bloqueado">Bloqueado</option>
                </select>
                <div className="form-actions">
                  <button type="submit" className="btn btn--save">Guardar cambios</button>
                  <button type="button" className="btn btn--cancel" onClick={() => setEditingUser(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* =============================================== */}
          {/* BARRA DE HERRAMIENTAS: BUSCADOR + EXPORTAR */}
          {/* =============================================== */}
          <div className="actions-toolbar" style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '30px 0 20px 0', flexWrap: 'wrap' }}>
            
            {/* BUSCADOR (Se expande) */}
            <div className="input-with-icon" style={{ flex: 1, minWidth: '250px' }}>
              <span className="icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por Nombre, Apellido, Email o Área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>

            {/* BOTONES DE EXPORTAR */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={exportarExcel} 
                className="btn" 
                style={{ backgroundColor: '#1D6F42', color: 'white', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                📊 Excel
              </button>
              <button 
                onClick={exportarPDF} 
                className="btn" 
                style={{ backgroundColor: '#D32F2F', color: 'white', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                📄 PDF
              </button>
            </div>
          </div>
          {/* =============================================== */}


          {/* --- LISTA DE USUARIOS FILTRADA --- */}
          <div className="user-list">
            {usuariosFiltrados.map((u) => (
              <div key={u.id} className="user-card">
                <div>
                  <h3>{u.nombre} {u.apellido}</h3>
                  <p>{u.email}</p>
                  {u.areaTrabajo && <p>Área: {u.areaTrabajo}</p>}
                  <span className={`badge ${u.estado === 'Bloqueado' ? 'badge--blocked' : 'badge--active'}`}>
                    {u.estado || "Activo"}
                  </span>
                  <p>Rol: {u.rol}</p>
                  <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "6px" }}>
                    Último acceso: {" "}
                    {u.ultimoAcceso
                      ? u.ultimoAcceso.toDate().toLocaleString("es-CO", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca"}
                  </p>
                </div>
                <div className="user-actions">
                  <button className="btn btn--edit" onClick={() => startEditUser(u)}>✏️ Editar</button>
                  <button
                    className={`btn ${u.estado === "Bloqueado" ? "btn--activate" : "btn--block"}`}
                    onClick={() => handleToggleBloqueo(u)}
                    title={u.estado === "Bloqueado" ? "Reactivar cuenta" : "Bloquear acceso inmediato"}
                  >
                    {u.estado === "Bloqueado" ? "Reactivar" : "Desactivar cuenta"}
                  </button>
                  <button className="btn btn--delete" onClick={() => handleEliminarUsuario(u)}>🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {/* --- MENSAJE SI NO HAY RESULTADOS --- */}
          {searchTerm && usuariosFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
              <p>No se encontraron usuarios que coincidan con "<strong>{searchTerm}</strong>".</p>
            </div>
          )}
        </section>
      )}
       {/* ===== MENSAJERÍA ===== */}
      {tab === "mensajes" && (
        <section className="users">
          <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
            <h2>Mensajería y Soporte</h2>
          </div>

          {mensajes.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#fff', borderRadius: '8px' }}>
              <p>No hay mensajes nuevos.</p>
            </div>
          )}

          <div className="msg-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {mensajes.map((m) => (
              <div key={m.id} className="msg-card" style={{ 
                border: '1px solid #eee', 
                padding: '15px 20px', 
                borderRadius: '10px', 
                backgroundColor: 'white',
                borderLeft: m.estado === 'respondido' ? '5px solid #2ecc71' : '5px solid #e74c3c',
                display: 'flex',            // Usamos flex para poner contenido a la izq y botones a la der
                justifyContent: 'space-between',
                alignItems: 'flex-start',   // <--- ESTO EVITA QUE LOS BOTONES SE ESTIREN
                gap: '20px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                
                {/* COLUMNA IZQUIERDA: CONTENIDO */}
                <div className="msg-main" style={{ flex: 1 }}>
                  <div className="msg-top" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#333' }}>{m.asunto || "Sin Asunto"}</strong>
                    
                    {/* Badge de Estado */}
                    {m.estado === "respondido" ? (
                      <span style={{ backgroundColor: '#2ecc71', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        ✓ Respondido
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="msg-content" style={{ color: '#555', marginBottom: '12px', lineHeight: '1.5' }}>
                    {m.contenido}
                  </p>
                  
                  {/* RESPUESTA */}
                  {m.respuesta && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                      <strong style={{ color: '#166534', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Tu respuesta:</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d' }}>{m.respuesta}</p>
                    </div>
                  )}

                  <small style={{ color: '#999', fontSize: '0.8rem' }}>
                    De: {m.remitente} • {m.creadoEn?.toDate?.().toLocaleString?.() || "—"}
                  </small>
                </div>

                {/* COLUMNA DERECHA: BOTONES (Ahora compactos) */}
                <div className="msg-actions" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button 
                    onClick={() => responderMensaje(m)}
                    style={{ 
                      backgroundColor: '#3498db', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px',      // <--- Padding reducido
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',      // <--- Letra más pequeña
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      minWidth: '100px'
                    }}
                  >
                    {m.respuesta ? "Editar Resp." : "Responder"}
                  </button>
                  
                  <button 
                    onClick={() => eliminarMensaje(m)}
                    style={{ 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px',      // <--- Padding reducido
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',      // <--- Letra más pequeña
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      minWidth: '100px'
                    }}
                  >
                    Eliminar
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>
      )}
        {/* CALENDARIO */}
      {tab === "calendario" && (
        <section className="calendario-section">
          <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Calendario de Eventos</h2>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginTop: '1rem'
          }}>
            <Calendario />
          </div>
          
          
        </section>
      )}

        {/* ===== NOTIFICACIONES ===== */}
      {tab === "notis" && (
        <section className="users">
          <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
            <h2>Notificaciones</h2>
            <button className="btn btn--add" onClick={crearNotiDemo}>+ Crear demo</button>
          </div>

          {notificaciones.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#fff', borderRadius: '8px' }}>
              <p>No hay notificaciones.</p>
            </div>
          )}

          <div className="msg-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {notificaciones.map((n) => (
              <div key={n.id} className="msg-card" style={{ 
                border: '1px solid #eee', 
                padding: '15px 20px', 
                borderRadius: '10px', 
                backgroundColor: 'white',
                borderLeft: !n.leida ? '5px solid #3498db' : '5px solid #ccc', // Azul si es nueva, gris si es leída
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start', // <--- EVITA QUE SE ESTIREN LOS BOTONES
                gap: '20px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                
                <div className="msg-main" style={{ flex: 1 }}>
                  <div className="msg-top" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#333' }}>{n.titulo}</strong>
                    {!n.leida && (
                      <span style={{ backgroundColor: '#3498db', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Nueva
                      </span>
                    )}
                  </div>
                  
                  <p className="msg-content" style={{ color: '#555', marginBottom: '8px', lineHeight: '1.5' }}>
                    {n.descripcion}
                  </p>
                  
                  <small style={{ color: '#999', fontSize: '0.8rem' }}>
                    Tipo: <strong>{n.tipo}</strong> · {n.creadoEn?.toDate?.().toLocaleString?.() || "—"}
                  </small>
                </div>

                <div className="msg-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!n.leida && (
                    <button 
                      onClick={() => marcarNotiLeida(n)}
                      style={{ 
                        backgroundColor: '#3498db', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px',
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Marcar leída
                    </button>
                  )}

                  {/* NUEVO BOTÓN DE ELIMINAR */}
                  <button 
                    onClick={() => eliminarNoti(n)}
                    style={{ 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px',
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      minWidth: '100px'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
        {/* ===== NOTICIAS CON ACORDEÓN (IMAGEN PEQUEÑA) ===== */}
        {tab === "noticias" && (
          <section className="users">
            <div
              className="courses__header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Gestión de Noticias</h2>
            </div>

            {/* FORMULARIO (sin cambios) */}
            <div className="add-course">
              <h2>{editarNoticiaId ? "Editar noticia" : "Publicar nueva noticia"}</h2>
              <form id="form-noticia" onSubmit={editando ? actualizarNoticia : publicarNoticia} className="form">
                <input type="text" placeholder="Título de la noticia" value={tituloNoticia} onChange={(e) => setTituloNoticia(e.target.value)} required />
                <textarea placeholder="Contenido de la noticia" value={contenidoNoticia} onChange={(e) => setContenidoNoticia(e.target.value)} required />
                <input
                  type="text"
                  placeholder="URL de imagen (opcional)"
                  value={imagenUrl}
                  onChange={(e) => {
                    setImagenUrl(e.target.value);
                    setPreviewNoticia(e.target.value);
                  }}
                />
                {previewNoticia && (
                  <img
                    src={previewNoticia}
                    alt="Vista previa"
                    style={{ width: 250, borderRadius: 8, marginTop: 10, border: "1px solid #ccc" }}
                    onError={(e) => (e.target.src = "https://via.placeholder.com/250x150?text=No+disponible")}
                  />
                )}

                {/* Selector de categoría */}
                <div className="categoria-selector" style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Seleccionar categoría"
                    value={categoria}
                    readOnly
                    onClick={() => setMostrarAcordeon(!mostrarAcordeon)}
                    style={{ cursor: "pointer", backgroundColor: "#fff", border: "1px solid #ccc", padding: "8px", borderRadius: "6px", width: "100%" }}
                  />
                  {mostrarAcordeon && (
                    <div className="acordeon-categorias" style={{
                      position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#f9f9f9",
                      border: "1px solid #ccc", borderRadius: "6px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      zIndex: 1000, maxHeight: "200px", overflowY: "auto", marginTop: "4px"
                    }}>
                      {categoriasBanco.map((cat, index) => (
                        <div key={index} onClick={() => { setCategoria(cat); setMostrarAcordeon(false); }}
                          style={{
                            padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee",
                            backgroundColor: categoria === cat ? "#e0f7fa" : "transparent"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = categoria === cat ? "#e0f7fa" : "transparent"}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input type="text" placeholder="Autor" value={autor || "Administrador"} readOnly style={{ backgroundColor: "#f3f3f3", border: "1px solid #ccc", padding: "8px", borderRadius: "6px", width: "100%", color: "#555" }} />
                <input type="date" value={fechaPublicacion} onChange={(e) => setFechaPublicacion(e.target.value)} />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn btn--save">
                    {editarNoticiaId ? "Actualizar Noticia" : "Publicar Noticia"}
                  </button>
                  {editarNoticiaId && (
                    <button type="button" onClick={cancelarEdicion} className="btn btn--cancel">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* LISTADO CON ACORDEÓN - IMAGEN PEQUEÑA */}
            <div className="news-list-acordeon">
              {noticias.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">No hay noticias publicadas.</p>
              ) : (
                noticias.map((n) => {
                  const estaExpandida = idExpandido === n.id;
                  const imagenSrc = n.imagen && n.imagen.startsWith("http")
                    ? n.imagen
                    : "https://via.placeholder.com/300x200?text=Sin+imagen";

                  return (
                    <div
                      key={n.id}
                      className={`noticia-admin-card ${estaExpandida ? 'expandida' : ''}`}
                      onClick={() => handleCardClick(n.id)}
                    >
                      {/* Header clickeable */}
                      <div className="noticia-header">
                        <div className="header-info">
                          <h3 className="noticia-titulo-admin">{n.titulo}</h3>
                          <div className="noticia-meta-admin">
                            <span className="categoria-tag">{n.categoria || "General"}</span>
                            <span>
                              {n.fechaPublicacion?.toDate?.().toLocaleDateString?.("es-ES") || "—"}
                            </span>
                            <span>Por {n.autor || "Administrador"}</span>
                          </div>
                        </div>
                        <span className="flecha-acordeon">
                          {estaExpandida ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Contenido expandido - IMAGEN PEQUEÑA */}
                      <div className="noticia-contenido-admin">
                        <div className="contenido-con-imagen">
                          {/* Imagen pequeña (igual que antes) */}
                          {n.imagen && (
                            <div className="imagen-pequena-container">
                              <img
                                src={imagenSrc}
                                alt={n.titulo}
                                className="imagen-pequena"
                                onError={(e) => (e.target.src = "https://via.placeholder.com/120x80?text=No+img")}
                              />
                            </div>
                          )}

                          <div className="texto-expandido">
                            <p className="descripcion-completa">{n.descripcion}</p>
                          </div>
                        </div>

                        {/* Botones siempre visibles al expandir */}
                        <div className="acciones-expandida">
                          <button
                            className="btn btn--edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              editarNoticia(n);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn--delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarNoticia(n.id);
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}








        {tab === "muro" && (
          <section className="users" aria-labelledby="muro-heading">
            <div
              className="courses__header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
              }}
            >
              <h2 id="muro-heading">Gestión del Muro Informativo</h2>
              <button
                className="btn btn--add"
                onClick={() => {
                  limpiarFormularioMuro();
                  setVisualMuro("formulario");
                }}
              >
                ➕ Nuevo Mensaje
              </button>
            </div>

            {/* ===== Formulario para crear/editar mensajes ===== */}
            {visualMuro === "formulario" && (
              <div className="add-course">
                <h3>{editandoMuro ? "✏️ Editar mensaje" : "➕ Publicar nuevo mensaje"}</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (editandoMuro) {
                      await actualizarMuroInformativo();
                    } else {
                      await publicarMuroInformativo();
                    }
                  }}
                  className="form"
                >
                  <div className="form-group">
                    <label htmlFor="titulo-muro">Título del mensaje</label>
                    <input
                      id="titulo-muro"
                      type="text"
                      placeholder="Título del mensaje"
                      value={tituloMuro}
                      onChange={(e) => setTituloMuro(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contenido-muro">Contenido del mensaje</label>
                    <textarea
                      id="contenido-muro"
                      placeholder="Contenido del mensaje"
                      value={contenidoMuro}
                      onChange={(e) => setContenidoMuro(e.target.value)}
                      rows="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="categoria-muro">Categoría</label>
                    <div className="categoria-selector" style={{ position: "relative" }}>
                      <input
                        id="categoria-muro"
                        type="text"
                        placeholder="Seleccionar categoría"
                        value={categoriaMuro}
                        readOnly
                        onClick={() => setMostrarAcordeonMuro(!mostrarAcordeonMuro)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          padding: "8px",
                          borderRadius: "6px",
                          width: "100%",
                        }}
                      />
                      {mostrarAcordeonMuro && (
                        <div
                          className="acordeon-categorias"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            zIndex: 1000,
                            maxHeight: "200px",
                            overflowY: "auto",
                            marginTop: "4px",
                          }}
                        >
                          {categoriasMuro.map((cat, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setCategoriaMuro(cat);
                                setMostrarAcordeonMuro(false);
                              }}
                              style={{
                                padding: "10px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                backgroundColor: categoriaMuro === cat ? "#e0f7fa" : "transparent",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                categoriaMuro === cat ? "#e0f7fa" : "transparent")
                              }
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="imagen-muro">URL del Ícono (ingresar URL)</label>
                    <input
                      id="imagen-muro"
                      type="text"
                      placeholder="Pega aquí la URL de la imagen (ej. https://example.com/imagen.jpg)"
                      value={imagenurl || ""}
                      onChange={(e) => setImagenurl(e.target.value)} // Actualizar el estado con la URL ingresada
                    />
                    {imagenurl && (
                      <img
                        src={imagenurl}
                        alt="Vista previa del ícono"
                        style={{ width: "50px", height: "50px", marginTop: "10px", borderRadius: "50%" }}
                        onError={(e) => console.log("Error al cargar la URL de la imagen:", e)} // Depuración
                      />
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn--save">
                      {editandoMuro ? "Actualizar Mensaje" : "Publicar Mensaje"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--cancel"
                      onClick={limpiarFormularioMuro}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== Lista de mensajes publicados ===== */}
            {visualMuro === "lista" && (
              <div className="course-list">
                {muroInformativo.length === 0 ? (
                  <p className="text-center text-gray-500 mt-4">
                    No hay mensajes publicados.
                  </p>
                ) : (
                  muroInformativo.map((m) => (
                    <div key={m.id} className="course-card">
                      <div className="news-info">
                        <h3>{m.titulo}</h3>
                        <span className="news-tag">{m.categoria || "General"}</span>
                        <p>{m.descripcion}</p>
                        <small>
                          Publicado el:{" "}
                          {m.fecha?.toDate?.().toLocaleDateString?.("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "Fecha no disponible"}

                          {m.fechaActualizada && (
                            <>
                              <br />
                              {" · Actualizado el: "}
                              {m.fechaActualizada?.toDate?.().toLocaleDateString?.("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) || "—"}
                            </>
                          )}
                        </small>
                      </div>
                      <div className="news-actions">
                        <button
                          className="btn btn--edit"
                          onClick={() => editarMuroInformativo(m)}
                          aria-label={`Editar mensaje ${m.titulo}`}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn--delete"
                          onClick={() => eliminarMuroInformativo(m.id)}
                          aria-label={`Eliminar mensaje ${m.titulo}`}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}

      </div>
  
  );
}

