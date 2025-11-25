// src/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  // Si no hay usuario → redirigir al login
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  // Si hay usuario → mostrar el contenido protegido
  return children;
}
