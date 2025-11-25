import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut, // Importamos signOut para la lógica de bloqueo
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig"; // Asegúrate de que la ruta sea correcta
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import infobankLogo from "../../assets/infobank-logo.png";
import "../../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Nueva Función Reutilizable ---
  // Esta función revisa el ROL y el ESTADO de un usuario
  // buscando en la colección "usuarios"
  const checkUserRoleAndStatus = async (user) => {
    try {
      // ✅ CORRECCIÓN: Apuntamos a "usuarios" en lugar de "roles"
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Si no existe el documento del usuario, no tiene permisos
        await signOut(auth);
        Swal.fire(
          "Error",
          "No tienes permisos asignados o tu usuario no existe.",
          "error"
        );
        return;
      }

      const userData = userDocSnap.data();

      // --- CAPA 1: Lógica de Bloqueo ---
      // Comprobamos el campo "estado" (en minúsculas por si acaso)
      if (userData.estado?.toLowerCase() === "bloqueado") {
        await signOut(auth); // Cerramos la sesión
        Swal.fire(
          "Acceso Denegado",
          "Tu cuenta ha sido bloqueada. Contacta al administrador.",
          "error"
        );
        return; // Detenemos la ejecución
      }
      // --- Fin de Lógica de Bloqueo ---

      // Si pasa el chequeo, redirigimos según el rol
      if (userData.rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error al obtener el rol/estado:", err);
      // Si hay un error de permisos leyendo el documento, lo expulsamos
      await signOut(auth);
    }
  };

  // ✅ Redirección automática (usa la nueva función)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si hay sesión, chequeamos su rol y estado
        await checkUserRoleAndStatus(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ Inicio de sesión (usa la nueva función)
  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Después de iniciar sesión, chequeamos su rol y estado
      await checkUserRoleAndStatus(user);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error: Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Recuperar contraseña (sin cambios)
  const handleOlvidarContrasena = async () => {
    const { value: correo } = await Swal.fire({
      title: "🔑 Recuperar contraseña",
      text: "Ingresa tu correo electrónico para recibir un enlace de recuperación:",
      input: "email",
      inputPlaceholder: "tu.email@infobank.com",
      confirmButtonText: "Enviar enlace",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value) {
          return "Por favor ingresa un correo válido.";
        }
      },
    });

    if (correo) {
      try {
        await sendPasswordResetEmail(auth, correo);
        Swal.fire(
          "✅ Enlace enviado",
          `Se ha enviado un enlace de recuperación a ${correo}.`,
          "success"
        );
      } catch (error) {
        Swal.fire(
          "❌ Error",
          "No se pudo enviar el correo. Verifica que el correo esté registrado.",
          "error"
        );
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <img src={infobankLogo} alt="Logo InfoBank" className="login-logo" />
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico o usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />



          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {mensaje && <p>{mensaje}</p>}
        <p className="forgot-password" onClick={handleOlvidarContrasena}>
          ¿Olvidaste tu contraseña?
        </p>

      </div>
    </div>
  );
}

