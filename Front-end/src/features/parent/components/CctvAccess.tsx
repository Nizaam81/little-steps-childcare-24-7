import { useState } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  VideoOff,
} from "lucide-react";
import type { Daycare } from "../dashboardTypes";

type CctvAccessProps = {
  centers: Daycare[];
};

const CctvAccess = ({ centers }: CctvAccessProps) => {
  const [requestedCenters, setRequestedCenters] = useState<number[]>([]);

  const requestAccess = (center: Daycare) => {
    setRequestedCenters((current) =>
      current.includes(center.id) ? current : [...current, center.id],
    );
    toast.success("Demo request saved in this page only. Nothing was sent to a provider.");
  };

  return (
    <section id="camera-access" className="space-y-5" aria-labelledby="camera-access-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#278a70]">PARENT SAFETY</p>
          <h2 id="camera-access-title" className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b]">
            Live camera access
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687a88]">
            Request access to a center’s cameras. Providers must approve access before a secure live stream can be shown.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dcece5] bg-white px-3 py-1.5 text-xs font-semibold text-[#526777]">
          <LockKeyhole size={14} className="text-[#278a70]" /> Secure access required
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {centers.map((center, index) => {
          const requested = requestedCenters.includes(center.id);
          return (
            <article key={center.id} className="overflow-hidden rounded-2xl border border-[#e3ece7] bg-white shadow-sm">
              <div className="relative h-36 overflow-hidden bg-[#e8f2ed]">
                <img src={center.image} alt="" className="h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#26384b]/35 text-white">
                  <VideoOff size={28} />
                  <span className="mt-2 text-sm font-semibold">Camera feed not connected</span>
                </div>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#526777]">
                  <Camera size={13} /> {index % 2 === 0 ? "Playroom" : "Main entrance"}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-bold text-[#26384b]">{center.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#778691]">
                    <ShieldCheck size={14} className="text-[#278a70]" /> Provider approval required
                  </p>
                </div>
                <button
                  type="button"
                  disabled={requested}
                  onClick={() => requestAccess(center)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    requested
                      ? "cursor-default border border-[#dcece5] bg-[#f0f8f4] text-[#237960]"
                      : "bg-[#278a70] text-white shadow-sm hover:bg-[#1f755f]"
                  }`}
                >
                  {requested ? <CheckCircle2 size={16} /> : <LockKeyhole size={16} />}
                  {requested ? "Demo request saved" : "Request camera access"}
                </button>
                <p className="text-xs leading-5 text-[#81929b]">
                  Preview only: no camera is active and no provider has received this request.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CctvAccess;
