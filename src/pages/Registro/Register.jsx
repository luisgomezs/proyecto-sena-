// src/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmar) {
      setMensaje("❌ Las contraseñas no coinciden");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMensaje("✅ Usuario registrado con éxito");
      navigate("/dashboard"); // Redirige al dashboard si quieres
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error: " + error.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <h2>Crear Cuenta</h2>
        <input
          type="email"
          placeholder="Correo"
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
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <button type="submit" style={{ marginTop: "10px" }}>Registrarse</button>
        {mensaje && <p>{mensaje}</p>}
        <p style={{ marginTop: "10px" }}>
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}

