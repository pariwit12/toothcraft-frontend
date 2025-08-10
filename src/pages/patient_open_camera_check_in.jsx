import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function PatientCheckin() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 }
    );

    scanner.render(
      (decodedText) => {
        console.log("QR Code scanned:", decodedText);
        // ไปต่อทันทีตาม URL ที่สแกนได้
        window.location.href = decodedText;
      },
      (error) => {
        console.warn("Scan error:", error);
      }
    );

    return () => {
      scanner.clear();
    };
  }, []);

  return (
    <div>
      <h2>สแกน QR Code เพื่อลงทะเบียนเข้ารับการรักษา</h2>
      <div id="reader" style={{ width: "300px", margin: "auto" }}></div>
    </div>
  );
}
