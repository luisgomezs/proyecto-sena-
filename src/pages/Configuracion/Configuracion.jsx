import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import "./Configuracion.css";
// ✅ 1. Importamos el HOOK 'useTheme' del contexto
import { useTheme } from "../../context/ThemeContext";
// ✅ ¡NUEVO! Importamos SweetAlert2
import Swal from 'sweetalert2';

export default function Configuracion() {
  const [tab, setTab] = useState("perfil");
  const [usuario, setUsuario] = useState(null);

  // ✅ 2. Usamos el hook para obtener el estado GLOBAL y la función de cambio
  const { isDarkMode, toggleTheme } = useTheme();

  // ❌ 3. Ya NO necesitamos el estado local 'modoOscuro'
  // const [modoOscuro, setModoOscuro] = useState(
  //   localStorage.getItem("modoOscuro") === "true"
  // );

  const [notificaciones, setNotificaciones] = useState({
    email: true,
    recordatorios: true,
    alertas: false,
    updates: true, // Corregido el nombre de la clave si era 'actualizaciones'
  });

  // 🔹 Cargar datos del usuario (Esta parte se queda igual)
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const ref = doc(db, "usuarios", user.uid);
      getDoc(ref).then((snap) => {
        if (snap.exists()) {
          setUsuario(snap.data());
          // Podrías cargar las preferencias de notificación desde aquí también si las guardas en Firebase
        } else {
          // Valores por defecto si no existe el documento
          setUsuario({
            nombre: "", apellido: "", email: user.email,
            areaTrabajo: "", cargo: "", telefono: "",
          });
        }
      }).catch(error => {
        console.error("Error fetching user data:", error);
        // Manejar el error, tal vez mostrar un mensaje
      });
    }
  }, []);

  // ❌ 4. Ya NO necesitamos este useEffect local para el modo oscuro
  // El ThemeProvider se encarga de esto globalmente
  // useEffect(() => {
  //   document.body.classList.toggle("dark-mode", modoOscuro);
  //   localStorage.setItem("modoOscuro", modoOscuro);
  // }, [modoOscuro]);

  // 🔹 Guardar cambios del perfil (Esta parte se queda igual)
  const handleGuardarCambios = async () => {
    if (!usuario || !auth.currentUser) return; // Añadimos chequeo de currentUser
    const user = auth.currentUser;
    try {
      // Filtramos datos que no queremos guardar (como email si no se puede cambiar)
      const dataToSave = { ...usuario };
      delete dataToSave.email; // No guardamos el email si es fijo

      await updateDoc(doc(db, "usuarios", user.uid), dataToSave);
      // Usamos Swal para consistencia
      Swal.fire("✅ Guardado", "Cambios del perfil guardados.", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      Swal.fire("❌ Error", "No se pudieron guardar los cambios: " + error.message, "error");
    }
  };

  // 🔹 Guardar preferencias (Esta parte se queda igual)
  const handleGuardarPreferencias = () => {
     // Aquí podrías guardar las 'notificaciones' en Firebase si quisieras
    Swal.fire("✅ Guardado", "Preferencias de notificación actualizadas.", "success");
  };


  return (
    // ✅ 5. Aplicamos la clase 'dark' basada en el estado GLOBAL 'isDarkMode'
    <div className={`configuracion ${isDarkMode ? "dark" : ""}`}>
      <header className="config-header">
        <Link to="/dashboard" className="volver">
          Volver al Inicio
        </Link>
        <h2>⚙️ Configuración</h2>
      </header>

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "perfil" ? "active" : ""}`}
          onClick={() => setTab("perfil")}
        >
          🧍 Perfil
        </button>
        
        <button
          className={`tab-btn ${tab === "apariencia" ? "active" : ""}`}
          onClick={() => setTab("apariencia")}
        >
          💡 Apariencia
        </button>
      </div>

       {/* ===== PERFIL ===== */}
      {tab === "perfil" && usuario && (
        <section className="perfil">
          <h3>Información Personal</h3>
          <div className="perfil-form">
            <label>
              Nombre
              <input type="text" value={usuario.nombre || ''} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}/>
            </label>
            <label>
              Apellido
              <input type="text" value={usuario.apellido || ''} onChange={(e) => setUsuario({ ...usuario, apellido: e.target.value })}/>
            </label>
            <label>
              Correo Electrónico
              <input type="email" value={usuario.email || ''} disabled />
            </label>
            
            <label>
              Área
              <input type="text" value={usuario.areaTrabajo || ''} onChange={(e) => setUsuario({ ...usuario, areaTrabajo: e.target.value })}/>
            </label>
            
          </div>
          <button onClick={handleGuardarCambios} className="btn-guardar">
            💾 Guardar Cambios
          </button>
        </section>
      )}

      {/* ===== NOTIFICACIONES ===== */}
      {tab === "notificaciones" && (
        <section className="notificaciones">
          <h3>Preferencias de Notificaciones</h3>
          {/* Usamos Object.keys para asegurar un orden consistente */}
          {Object.keys(notificaciones).map((key) => (
            <div key={key} className="notif-item">
              <div>
                <strong>
                  {/* Mejoramos los textos */}
                  {key === "email" ? "Notificaciones por Correo"
                   : key === "recordatorios" ? "Recordatorios de Cursos"
                   : key === "alertas" ? "Alertas de Noticias Urgentes"
                   : key === "updates" ? "Actualizaciones del Sistema"
                   : key.charAt(0).toUpperCase() + key.slice(1)} {/* Default */}
                </strong>
                <p>
                  {/* Textos descriptivos */}
                   {key === "email" ? "Recibe avisos importantes directamente en tu bandeja de entrada."
                   : key === "recordatorios" ? "Te recordaremos las fechas límite de tus cursos inscritos."
                   : key === "alertas" ? "Recibe notificaciones inmediatas sobre comunicados urgentes."
                   : key === "updates" ? "Mantente informado sobre mantenimientos y nuevas funciones."
                   : ""}
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notificaciones[key]} // Usamos notificaciones[key]
                  onChange={() =>
                    setNotificaciones((prev) => ({ // Usamos el callback para seguridad
                      ...prev,
                      [key]: !prev[key], // Invertimos el valor de esta clave
                    }))
                  }
                />
                <span className="slider round"></span> {/* Clase round para estilo */}
              </label>
            </div>
          ))}
          <button onClick={handleGuardarPreferencias} className="btn-guardar">
            ✅ Guardar Preferencias
          </button>
        </section>
      )}

      {/* ===== APARIENCIA (MODIFICADO) ===== */}
      {tab === "apariencia" && (
        <section className="apariencia">
          <h3>Preferencias de Apariencia</h3>
          <div className="notif-item">
            <div>
              <strong>Modo Oscuro</strong>
              <p>
                Cambia la apariencia de la interfaz a un tema oscuro. Ideal
                para entornos con poca luz.
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                // ✅ 6. Usamos el estado GLOBAL
                checked={isDarkMode}
                // ✅ 7. Usamos la función GLOBAL
                onChange={toggleTheme}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <p className="info">
            🌙 El modo oscuro reduce la fatiga visual y ahorra batería en
            pantallas OLED.
          </p>
          {/* Puedes añadir más opciones de apariencia aquí */}
        </section>
      )}
    </div> // Cierre del div principal
  );
}

