import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function PatientCheckin() {
  const html5QrCodeRef = useRef(null);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]); // รายการกล้อง
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0); // กล้องที่ใช้

  // เช็ค permission กล้องก่อน ถ้า granted ให้ start เลย
  const checkAndStart = async () => {
    try {
      const status = await navigator.permissions.query({ name: "camera" });
      if (status.state === "granted") {
        setPermissionAsked(true);
        await getCamerasAndStart();
      } else {
        // ยังไม่ได้ permission หรือ denied ให้ขอ permission
        await requestCameraPermission();
      }
    } catch {
      // ถ้าไม่รองรับ permissions API ก็ขอ permission ปกติเลย
      await requestCameraPermission();
    }
  };

  // ขอ permission กล้อง (จะเด้ง popup)
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionAsked(true);
      await getCamerasAndStart();
    } catch (err) {
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตใช้กล้อง");
      console.error(err);
    }
  };

  // ดึงกล้อง แล้วเริ่มสแกนด้วยกล้องตัวที่เลือก
  const getCamerasAndStart = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);

        // หา index กล้องหลัง (label มีคำว่า "back" หรือ "rear")
        const backCameraIndex = devices.findIndex((device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
        );

        const initialIndex = backCameraIndex !== -1 ? backCameraIndex : 0;
        setCurrentCameraIndex(initialIndex);

        startScanning(devices[initialIndex].id);
      } else {
        alert("ไม่พบกล้องในอุปกรณ์");
      }
    } catch (err) {
      console.error("Error getting cameras", err);
      alert("ไม่พบกล้องในอุปกรณ์");
    }
  };

  // เริ่มสแกนกล้องด้วย cameraId ที่กำหนด
  const startScanning = (cameraId) => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }

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
  };

  // สลับกล้อง
  const switchCamera = async () => {
    if (!cameras.length) return;

    let nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(() => {});
      startScanning(cameras[nextIndex].id);
    }
  };

  // ตอนโหลดหน้า ลองเช็ค permission ทันที (แต่ไม่ start ถ้ายังไม่ได้ permission)
  useEffect(() => {
    checkAndStart();
    // ทำความสะอาดเมื่อ unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: "1rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>สแกน QR Code ที่เคาน์เตอร์</h2>

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

      {/* ปุ่มสลับกล้อง */}
      {permissionAsked && cameras.length > 1 && (
        <button
          onClick={switchCamera}
          style={{
            display: "block",
            margin: "0.5rem auto",
            padding: "0.4rem 1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#28a745",
            color: "white",
            cursor: "pointer",
          }}
          type="button"
        >
          สลับกล้อง ({cameras[currentCameraIndex]?.label || "ไม่ทราบ"})
        </button>
      )}
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