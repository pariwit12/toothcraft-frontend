import React, { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function PatientCheckin() {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    // เลือกกล้อง (cameraId) ตัวแรกที่เจอ (usually กล้องหลัง)
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;

          html5QrCode
            .start(
              cameraId,
              { fps: 10, qrbox: 250 },
              (decodedText) => {
                console.log("QR Code scanned:", decodedText);
                html5QrCode.stop(); // หยุดสแกนหลังเจอ QR แล้ว
                window.location.href = decodedText;
              },
              (errorMessage) => {
                // console.log("Scan error", errorMessage);
              }
            )
            .catch((err) => {
              console.error("Cannot start scanning.", err);
            });
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
      });

    // ทำความสะอาด resource เมื่อ component unmount
    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      <h2>สแกน QR Code เพื่อลงทะเบียนเข้ารับการรักษา</h2>
      <div id="reader" style={{ width: "300px", margin: "auto" }} />
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