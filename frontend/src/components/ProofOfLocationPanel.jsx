import { Camera, MapPin, PenLine, CheckCircle2 } from "lucide-react";
import { FOCUS_RING, EXPLORER_TX } from "../lib/ui";
import { POL_STEP, POL_STEP_MESSAGE } from "../hooks/useProofOfLocation";

/**
 * Khối UI Proof of Location dùng chung (khung camera, nút chụp, dòng GPS,
 * hộp hash, nút ký) — đi kèm hook useProofOfLocation. Trang gọi chỉ cần
 * quyết định `onSign` (ký sang trạng thái nào) và nhãn nút.
 */
export default function ProofOfLocationPanel({ pol, onSign, signLabel = "Ký xác nhận qua MetaMask" }) {
  const { step, error, position, photoUrl, hash, txResult, videoRef, startCamera, capture } = pol;

  return (
    <div className="bg-paper2 border border-rule rounded-none shadow-none p-5 sm:p-6">
      <div className="h-[240px] bg-forestD rounded-sm relative overflow-hidden mb-4">
        {step === POL_STEP.IDLE && (
          <button
            onClick={startCamera}
            className={"absolute inset-0 flex flex-col items-center justify-center gap-2 text-rule text-sm " + FOCUS_RING}
          >
            <Camera size={28} />
            Bấm để mở camera
          </button>
        )}

        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ display: step === POL_STEP.CAMERA_ON ? "block" : "none" }}
        />

        {photoUrl && step !== POL_STEP.CAMERA_ON && step !== POL_STEP.IDLE && (
          <img src={photoUrl} alt="Ảnh bằng chứng lô hàng vừa chụp" className="w-full h-full object-cover" />
        )}
      </div>

      {step === POL_STEP.CAMERA_ON && (
        <div className="flex justify-center -mt-10 mb-4 relative z-10">
          <button
            onClick={capture}
            aria-label="Chụp ảnh bằng chứng"
            className={"w-14 h-14 rounded-full bg-paper2 border-4 border-forest  " + FOCUS_RING}
          />
        </div>
      )}

      {position && (
        <div className="flex items-center gap-2 text-xs text-inksoft mb-2">
          <MapPin size={14} className="text-forest shrink-0" />
          <span>Tọa độ</span>
          <span className="font-mono text-ink ml-auto">
            {position.lat.toFixed(4)}°N, {position.lng.toFixed(4)}°E (±{Math.round(position.accuracy)}m)
          </span>
        </div>
      )}

      {[POL_STEP.LOCATING, POL_STEP.HASHING, POL_STEP.UPLOADING].includes(step) && (
        <div className="flex items-center gap-2 text-xs text-inksoft mb-3" role="status" aria-live="polite">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse shrink-0" aria-hidden="true" />
          {POL_STEP_MESSAGE[step]}
        </div>
      )}

      {hash && (
        <div className="mt-1 mb-3 p-2.5 bg-paper border border-dashed border-rule rounded-sm text-xs text-forest font-mono break-all">
          SHA-256: {hash.slice(0, 24)}...{hash.slice(-8)}
        </div>
      )}

      {error && (
        <div className="text-xs text-crimson mb-3" role="alert">{error}</div>
      )}

      {step === POL_STEP.READY_TO_SIGN && (
        <button
          onClick={onSign}
          className={"w-full py-3 rounded-sm bg-forest hover:bg-forestD text-cream text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] " + FOCUS_RING}
        >
          <PenLine size={16} />
          {signLabel}
        </button>
      )}

      {step === POL_STEP.SIGNING && (
        <div className="text-sm text-inksoft text-center" role="status" aria-live="polite">
          Đang chờ ký trong MetaMask...
        </div>
      )}

      {step === POL_STEP.DONE && (
        <div className="pt-4 border-t border-rule text-xs text-inksoft" role="status">
          <b className="flex items-center gap-1.5 text-forest font-medium mb-1 text-sm">
            <CheckCircle2 size={16} /> Đã xác nhận thành công
          </b>
          tx:{" "}
          <a
            className={"font-mono text-forest underline underline-offset-2 " + FOCUS_RING}
            href={EXPLORER_TX(txResult)}
            target="_blank"
            rel="noreferrer"
          >
            {txResult?.slice(0, 10)}...
          </a>
        </div>
      )}
    </div>
  );
}
