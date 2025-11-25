// src/hooks/useAutoLogoutOnBlock.js
import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Swal from "sweetalert2";

export default function useAutoLogoutOnBlock() {
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const userDocRef = doc(db, "usuarios", user.uid);

      const unsubscribeDoc = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.estado === "Inactivo" || data.estado === "Bloqueado") {
              console.log("CUENTA BLOQUEADA → EXPULSIÓN AUTOMÁTICA EN MARCHA");

              // 1. Cerrar sesión inmediatamente
              signOut(auth).catch(() => {});

              // 2. MOSTRAR MENSAJE INEVITABLE (SIN BOTONES)
              Swal.fire({
                icon: "error",
                title: "ACCESO BLOQUEADO",
                html: `
                  <div style="text-align: center; padding: 20px;">
                    <h2 style="color: #d33; margin: 20px 0; font-size: 2rem; font-weight: 900;">
                      CUENTA DESACTIVADA
                    </h2>
                    <p style="font-size: 1.3rem; margin: 20px 0; line-height: 1.7;">
                      El administrador ha <strong style="color: #d33;">bloqueado tu acceso</strong>.
                    </p>
                    <p style="color: #555; font-size: 1.1rem; margin: 20px 0;">
                      Ya no puedes usar el sistema.
                    </p>
                    <div style="background: #fee; border: 2px solid #d33; padding: 16px; border-radius: 12px; margin: 25px 0;">
                      <p style="margin: 0; color: #d33; font-weight: bold;">
                        Serás expulsado en <span id="countdown">15</span> segundos...
                      </p>
                    </div>
                    <p style="font-size: 0.95rem; color: #888;">
                      Contacta con <strong>soporte@infobank.com</strong>
                    </p>
                  </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false,   // SIN BOTÓN
                showCancelButton: false,    // SIN BOTÓN
                showCloseButton: false,     // SIN CRUZ
                timer: 15000,               // 15 SEGUNDOS OBLIGATORIOS
                timerProgressBar: true,
                backdrop: `
                  rgba(0,0,0,0.95)
                  url("https://i.gifer.com/embedded/preview/7VeW.gif")
                  center center
                  no-repeat
                `,
                background: "#fff",
                customClass: {
                  popup: "animated shake",
                  title: "swal-title-final",
                  htmlContainer: "swal-text-final",
                  timerProgressBar: "swal-timer-final",
                },
                didOpen: () => {
                  // SONIDO DE BLOQUEO DRAMÁTICO
                  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-emergency-alert-alarm-1004.mp3");
                  audio.volume = 0.6;
                  audio.play().catch(() => {});

                  // CONTADOR REGRESIVO EN VIVO
                  let timeLeft = 15;
                  const countdownEl = document.getElementById("countdown");
                  const interval = setInterval(() => {
                    timeLeft--;
                    if (countdownEl) countdownEl.textContent = timeLeft;
                    if (timeLeft <= 0) clearInterval(interval);
                  }, 1000);
                },
                willClose: () => {
                  // AL TERMINAR → EXPULSIÓN AUTOMÁTICA
                  window.location.href = "/";
                }
              });
            }
          }
        },
        (error) => {
          console.error("Error en onSnapshot:", error);
        }
      );

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);
}