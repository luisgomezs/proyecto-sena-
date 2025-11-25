import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Creamos el Contexto
const ThemeContext = createContext();

// 2. Creamos el Proveedor (Componente que manejará el estado)
export const ThemeProvider = ({ children }) => {
  // Estado para saber si el modo oscuro está activo
  // Lee el valor guardado en localStorage o usa 'false' (claro) por defecto
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Función para cambiar el tema
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Efecto para guardar en localStorage y aplicar clase al body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Guarda la preferencia
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Guarda la preferencia
    }
  }, [isDarkMode]); // Se ejecuta cada vez que 'isDarkMode' cambia

  // Valor que será compartido por el contexto
  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook personalizado para usar el contexto fácilmente
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
