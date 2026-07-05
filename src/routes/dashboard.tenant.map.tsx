import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchProperties, formatKsh, type DbProperty } from "@/lib/keja-api";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";

// Fix default marker icon paths (Leaflet + bundlers)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export const Route = createFileRoute("/dashboard/tenant/map")({ component: MapView });

function MapView() {
  const [rows, setRows] = useState<DbProperty[]>([]);
  const [mode, setMode] = useState<"map" | "list">("map");
  useEffect(() => { fetchProperties({ limit: 100 }).then((r) => setRows(r.rows)); }, []);

  const geo = useMemo(() => rows.filter((p) => p.latitude != null && p.longitude != null), [rows]);
  const center: [number, number] = geo[0] ? [geo[0].latitude!, geo[0].longitude!] : [-1.2921, 36.8219]; // Nairobi

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Explore on map</h1>
          <p className="text-sm text-muted-foreground mt-1">{geo.length} homes with locations</p>
        </div>
        <div className="inline-flex rounded-full border border-border p-1 bg-card">
          <button onClick={() => setMode("map")} className={`px-3 h-8 rounded-full text-xs inline-flex items-center gap-1 ${mode === "map" ? "bg-primary text-primary-foreground" : ""}`}><MapIcon className="h-3.5 w-3.5" />Map</button>
          <button onClick={() => setMode("list")} className={`px-3 h-8 rounded-full text-xs inline-flex items-center gap-1 ${mode === "list" ? "bg-primary text-primary-foreground" : ""}`}><LayoutGrid className="h-3.5 w-3.5" />List</button>
        </div>
      </div>

      {mode === "map" ? (
        <div className="rounded-2xl overflow-hidden border border-border h-[70vh]">
          <MapContainer center={center} zoom={12} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {geo.map((p) => (
              <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={icon}>
                <Popup>
                  <div className="w-48">
                    {p.cover_image && <img src={p.cover_image} alt="" className="w-full h-24 object-cover rounded" />}
                    <div className="font-semibold text-sm mt-2">{p.name}</div>
                    <div className="text-xs">{formatKsh(p.monthly_rent)}</div>
                    <Link to="/property/$id" params={{ id: p.id }} className="text-accent text-xs font-semibold">View details →</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((p) => <PropertyCardDB key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
