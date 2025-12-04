import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom"; // Link no se usaba, lo quité para limpiar
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import infobankLogo from "../../assets/infobank-logo.png";
import "../../App.css";

// ✅ Importamos los iconos del ojito
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // ✅ Nuevo estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserRoleAndStatus = async (user) => {
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(auth);
        Swal.fire("Error", "No tienes permisos asignados o tu usuario no existe.", "error");
        return;
      }

      const userData = userDocSnap.data();

      if (userData.estado?.toLowerCase() === "bloqueado") {
        await signOut(auth);
        Swal.fire("Acceso Denegado", "Tu cuenta ha sido bloqueada. Contacta al administrador.", "error");
        return;
      }

      if (userData.rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error al obtener el rol/estado:", err);
      await signOut(auth);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkUserRoleAndStatus(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await checkUserRoleAndStatus(user);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error: Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

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
        if (!value) return "Por favor ingresa un correo válido.";
      },
    });

    if (correo) {
      try {
        await sendPasswordResetEmail(auth, correo);
        Swal.fire("✅ Enlace enviado", `Se ha enviado un enlace de recuperación a ${correo}.`, "success");
      } catch (error) {
        Swal.fire("❌ Error", "No se pudo enviar el correo. Verifica que el correo esté registrado.", "error");
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

          {/* ✅ CONTENEDOR RELATIVO PARA EL INPUT DE PASSWORD */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              // ✅ Cambiamos el tipo dinámicamente
              type={showPassword ? "text" : "password"} 
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", paddingRight: "40px" }} // padding extra para que el texto no toque el icono
            />
            
            {/* ✅ BOTÓN DEL ICONO (OJITO) */}
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6b7280", // Un gris suave
                display: "flex",
                alignItems: "center"
              }}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </span>
          </div>

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