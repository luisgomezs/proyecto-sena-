import { useState } from "react";

// Configuración FINAL – ¡¡REEMPLAZA TU_API_KEY_AQUÍ con tu número real!!
const CLOUD_NAME = "Raiz";              // ← Tu cloud_name (con mayúscula)
const UPLOAD_PRESET = "react-test";     // ← Tu preset unsigned
const API_KEY = "759382614968949";      // ← PEGA AQUÍ TU API KEY (ej: "123456789012345")

export default function ImageUploader({ onImageUpload, currentImage }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("api_key", API_KEY);  // ← ESTA LÍNEA SOLUCIONA EL "Unknown API key"

    try {
      console.log("Iniciando subida a Cloudinary...");
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Status:", response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error("Error detallado:", data);
        throw new Error(data.error?.message || `Error ${response.status}`);
      }

      // ¡SUBIDA EXITOSA!
      console.log("¡URL de la imagen:", data.secure_url);
      onImageUpload(data.secure_url);

      alert("¡Imagen subida correctamente!");  // Opcional: feedback al usuario

    } catch (error) {
      console.error("Error completo:", error);
      alert(`Error: ${error.message}. Verifica tu API Key.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "20px 0", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center" }}>
      {currentImage && (
        <div style={{ marginBottom: "15px" }}>
          <img
            src={currentImage}
            alt="Imagen actual"
            style={{
              maxWidth: "300px",
              height: "auto",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        </div>
      )}

      <label style={{ 
        display: "block", 
        padding: "12px 20px", 
        background: uploading ? "#f0f0f0" : "#007bff", 
        color: uploading ? "#666" : "white", 
        borderRadius: "8px", 
        cursor: "pointer",
        margin: "0 auto",
        width: "fit-content"
      }}>
        {uploading ? "⏳ Subiendo..." : "📁 Elegir nueva imagen"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {uploading && (
        <div style={{ marginTop: "10px", color: "#007bff", fontWeight: "bold" }}>
          Procesando... (usa WiFi para fotos grandes)
        </div>
      )}
    </div>
  );
}