import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function PatientCheckin() {
  const html5QrCodeRef = useRef(null);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [scanning, setScanning] = useState(false);

  // ขอ permission กล้องล่วงหน้า
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionAsked(true);
      startScanning();
    } catch (err) {
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตใช้กล้อง");
      console.error(err);
    }
  };

  const startScanning = () => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;
          html5QrCodeRef.current
            .start(
              cameraId,
              { fps: 10, qrbox: 250 },
              (decodedText) => {
                console.log("QR Code scanned:", decodedText);
                html5QrCodeRef.current
                  .stop()
                  .catch(() => {})
                  .finally(() => {
                    window.location.href = decodedText;
                  });
              },
              (errorMessage) => {
                // console.log("Scan error", errorMessage);
              }
            )
            .then(() => setScanning(true))
            .catch((err) => {
              console.error("Cannot start scanning.", err);
              alert("ไม่สามารถเริ่มกล้องได้");
            });
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        alert("ไม่พบกล้องในอุปกรณ์");
      });
  };

  useEffect(() => {
    // ไม่เริ่มสแกนอัตโนมัติ รอให้ user กดปุ่มก่อน
  }, []);

  return (
    <div style={{ padding: "1rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>สแกน QR Code เพื่อลงทะเบียนเข้ารับการรักษา</h2>

      {!permissionAsked && (
        <button
          onClick={requestCameraPermission}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
            borderRadius: "6px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          เริ่มสแกนกล้อง
        </button>
      )}

      <div
        id="reader"
        style={{
          width: "300px",
          margin: "1rem auto",
          border: scanning ? "2px solid #007bff" : "none",
          borderRadius: "6px",
          display: permissionAsked ? "block" : "none",
        }}
      />
    </div>
  );
}



// import React, { useEffect } from "react";
// import { Html5QrcodeScanner } from "html5-qrcode";

// export default function PatientCheckin() {
//   useEffect(() => {
//     const scanner = new Html5QrcodeScanner(
//       "reader",
//       { fps: 10, qrbox: 250 }
//     );

//     scanner.render(
//       (decodedText) => {
//         console.log("QR Code scanned:", decodedText);
//         // ไปต่อทันทีตาม URL ที่สแกนได้
//         window.location.href = decodedText;
//       },
//       (error) => {
//         console.warn("Scan error:", error);
//       }
//     );

//     return () => {
//       scanner.clear();
//     };
//   }, []);

//   return (
//     <div>
//       <h2>สแกน QR Code เพื่อลงทะเบียนเข้ารับการรักษา</h2>
//       <div id="reader" style={{ width: "300px", margin: "auto" }}></div>
//     </div>
//   );
// }