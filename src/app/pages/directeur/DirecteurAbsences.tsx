import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import type { Absence, Enseignant, Etablissement } from "../../context/AppContext";
import Pagination from "../../components/Pagination";
import { Search, Edit2, Trash2, AlertTriangle, Hash, Clock, Calendar, X, Printer, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useDayLock } from "../../hooks/useDayLock";

const PER_PAGE = 10;

type QuartValue = "matin" | "soir";

const QUARTS: { value: QuartValue; label: string; emoji: string; color: string }[] = [
  { value: "matin", label: "Matin", emoji: "🌅", color: "amber"  },
  { value: "soir",  label: "Soir",  emoji: "🌆", color: "indigo" },
];

// ── Modal pour Modifier Absence ──────────────────────────────────────────────
function AbsenceModal({
  open, onClose, onSave, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Absence>) => void;
  initial: Absence | null;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date,    setDate]    = useState(initial?.dateAbsence ? initial.dateAbsence.split("T")[0] : today);
  const [quart,   setQuart]   = useState<QuartValue>(initial?.quart || "matin");
  const [periode, setPeriode] = useState<number>(initial?.periode || 4);

  useEffect(() => {
    if (open) {
      setDate(initial?.dateAbsence ? initial.dateAbsence.split("T")[0] : new Date().toISOString().split("T")[0]);
      setQuart(initial?.quart || "matin");
      setPeriode(initial?.periode || 4);
    }
  }, [open, initial]);

  const maxH = 4;
  const heuresOpts = Array.from({ length: maxH }, (_, i) => ({ value: i + 1, label: `${i + 1}h` }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ dateAbsence: date, quart, periode });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Modifier l'absence</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              <Calendar className="w-4 h-4 text-blue-500" />Date de l'absence
            </label>
            <input
              type="date" value={date} max={today}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Quart */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              <Clock className="w-4 h-4 text-blue-500" />Quart d'absence
            </label>
            <div className="grid grid-cols-2 gap-3">
              {QUARTS.map(q => {
                const isActive = quart === q.value;
                const activeClass = q.color === "amber" ? "border-amber-500 bg-amber-50" : "border-indigo-500 bg-indigo-50";
                const textClass = q.color === "amber" ? "text-amber-800" : "text-indigo-800";
                return (
                  <button key={q.value} type="button" onClick={() => setQuart(q.value)}
                    className={`flex flex-col items-center gap-1 px-4 py-4 rounded-xl border-2 transition ${isActive ? activeClass : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                    <span style={{ fontSize: "1.75rem" }}>{q.emoji}</span>
                    <span className={`text-sm ${isActive ? textClass : "text-gray-700"}`} style={{ fontWeight: 700 }}>{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heures */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              <Clock className="w-4 h-4 text-purple-500" />Nombre d'heures
            </label>
            <div className="grid grid-cols-4 gap-2">
              {heuresOpts.map(opt => {
                const isActive = periode === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setPeriode(opt.value)}
                    className={`flex items-center justify-center py-3 rounded-xl border-2 transition ${isActive ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                    <span className={`text-lg ${isActive ? "text-purple-700" : "text-gray-700"}`} style={{ fontWeight: 800 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>
              Annuler
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition text-sm" style={{ fontWeight: 600 }}>
              Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PDF / Impression journée ──────────────────────────────────────────────────
async function imprimerJournee(
  date: string,
  absencesDuJour: Absence[],
  enseignants: Enseignant[],
  etablissement: Etablissement | undefined,
  directorName: string
) {
  // Load header image as base64
  let imgSrc = "";
  try {
    const resp = await fetch("/en-tete.png");
    const blob = await resp.blob();
    imgSrc = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    // If image fails to load, continue without it
  }

  const dateFormatted = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const printDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });
  const nomEcole = etablissement?.nom ?? "Établissement";
  const adresseEcole = etablissement?.adresse ?? "";
  const cycle = etablissement?.cycle ?? "";

  // Build table rows — no emojis for clean printing
  const rows = absencesDuJour.map(a => {
    const ens = enseignants.find(e => e.ppr === a.enseignantPpr);
    const quartLabel = a.quart === "matin" ? "Matin" : a.quart === "soir" ? "Soir" : (a.quart ?? "-");
    return `
      <tr>
        <td>${ens?.ppr ?? "-"}</td>
        <td>${ens?.nom ?? "-"}</td>
        <td>${ens?.prenom ?? "-"}</td>
        <td>${ens?.sexe ?? "-"}</td>
        <td>${ens?.matiere ?? "-"}</td>
        <td style="text-align:center">${ens?.totalHeureAbsences ?? "-"}</td>
        <td style="text-align:center">${quartLabel}</td>
        <td style="text-align:center">${a.periode}h</td>
      </tr>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Absences du ${dateFormatted}</title>
  <style>
    @page {
      size: A4;
      margin: 1cm 1.5cm;
    }
    @media print {
      @page { margin: 0; }
      body { margin: 1.6cm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #1e293b;
      padding: 28px 40px;
      font-size: 12px;
      line-height: 1.6;
    }
    .header-img {
      width: 100%;
      max-height: 110px;
      object-fit: contain;
      margin-bottom: 20px;
      display: block;
    }
    .school-bar {
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .school-bar h1 {
      font-size: 15px;
      font-weight: 800;
      color: #1d4ed8;
      margin-bottom: 2px;
    }
    .school-bar p {
      font-size: 11px;
      color: #475569;
    }
    .doc-title {
      text-align: center;
      margin-bottom: 16px;
    }
    .doc-title h2 {
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title .date-badge {
      display: inline-block;
      margin-top: 5px;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 3px 14px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    thead tr {
      background: #1d4ed8;
      color: #fff;
    }
    thead th {
      padding: 9px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    tbody tr:nth-child(even) { background: #f0f9ff; }
    tbody tr:nth-child(odd)  { background: #fff; }
    tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .footer {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .print-date { font-size: 10px; color: #94a3b8; }
    .signature-box { text-align: center; }
    .signature-box .label {
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 36px;
    }
    .signature-box .name {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
      border-top: 1.5px solid #94a3b8;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  ${imgSrc ? `<img src="${imgSrc}" class="header-img" alt="En-tete" />` : ""}

  <div class="school-bar">
    <h1>${nomEcole}</h1>
    ${adresseEcole ? `<p>Adresse : ${adresseEcole}</p>` : ""}
    ${cycle ? `<p>Cycle : ${cycle}</p>` : ""}
  </div>

  <div class="doc-title">
    <h2>Liste des Enseignants Absents</h2>
    <div class="date-badge">${dateFormatted}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>PPR</th>
        <th>Nom</th>
        <th>Prénom</th>
        <th>Sexe</th>
        <th>Matière</th>
        <th style="text-align:center">Total H. Abs.</th>
        <th style="text-align:center">Quart</th>
        <th style="text-align:center">Période</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:16px">Aucune absence pour cette journée</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
  </div>
</body>
</html>`;

  // Use Blob URL to avoid showing "about:blank" in the print footer
  const pdfBlob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(pdfBlob);
  const win = window.open(blobUrl, "_blank", "width=900,height=1100");
  if (!win) {
    URL.revokeObjectURL(blobUrl);
    alert("Veuillez autoriser les fenêtres popup pour imprimer.");
    return;
  }
  win.addEventListener("load", () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(blobUrl);
    }, 400);
  });
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function DirecteurAbsences() {
  const { enseignants, absences, updateAbsence, deleteAbsence, currentUser, etablissements } = useApp();

  const myTeachers = enseignants.filter(e => e.etaId === currentUser?.etaId);
  const myPprs     = new Set(myTeachers.map(e => e.ppr));
  const myAbsences = absences.filter(a => myPprs.has(a.enseignantPpr));

  const today = new Date().toISOString().split("T")[0];
  const { isLocked, lockDate } = useDayLock();
  const todayLocked = isLocked(currentUser?.etaId, today);

  const [search,      setSearch]      = useState("");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Absence | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<Absence | null>(null);
  const [page,        setPage]        = useState(1);
  const [confirmValidate, setConfirmValidate] = useState(false);

  const filtered = myAbsences.filter(a => {
    const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
    if (!e) return false;
    return `${e.nom} ${e.prenom} ${e.matiere || ""} ${e.ppr} ${a.dateAbsence}`.toLowerCase().includes(search.toLowerCase());
  });

  const sorted    = [...filtered].sort((a, b) => b.dateAbsence.localeCompare(a.dateAbsence));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleEdit   = (a: Absence) => {
    if (isLocked(currentUser?.etaId, a.dateAbsence.split("T")[0])) return;
    setEditTarget(a); setModalOpen(true);
  };
  const handleSave   = (data: Partial<Absence>) => { if (editTarget) updateAbsence(editTarget.id, data); };
  const handleDelete = () => { if (deleteTarget) { deleteAbsence(deleteTarget.id); setDeleteTarget(null); } };

  const handleValider = () => {
    lockDate(currentUser?.etaId, today);
    setConfirmValidate(false);
  };

  const etablissement = etablissements.find(et => et.id === currentUser?.etaId);
  const directorName  = currentUser?.nom ?? "Directeur";
  const todayAbsences = myAbsences.filter(a => a.dateAbsence.split("T")[0] === today);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Gestion des absences</h2>
          <p className="text-gray-500 text-sm">
            {myAbsences.length} absence{myAbsences.length > 1 ? "s" : ""} enregistrée{myAbsences.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Bouton Valider / statut verrouillé + Imprimer la journée ── */}
        {todayLocked ? (
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-700 text-sm" style={{ fontWeight: 600 }}>Journée validée — accès restreint</span>
            </div>
            <button
              onClick={() => imprimerJournee(today, todayAbsences, myTeachers, etablissement, directorName)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm text-sm"
              style={{ fontWeight: 600 }}
            >
              <Printer className="w-4 h-4" />
              Imprimer la journée
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmValidate(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm text-sm"
            style={{ fontWeight: 600 }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Valider la journée
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par enseignant, date…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <p style={{ fontWeight: 500 }}>Aucune absence trouvée</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Enseignant</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Date</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Quart</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Heures</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Type</th>
                    <th className="text-right text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(a => {
                    const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
                    const q = QUARTS.find(q => q.value === a.quart);
                    const absDate = a.dateAbsence.split("T")[0];
                    const rowLocked = isLocked(currentUser?.etaId, absDate);
                    return (
                      <tr key={a.id} className={`hover:bg-gray-50/50 transition ${rowLocked ? "bg-gray-50/70" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${e?.sexe === "Féminin" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`} style={{ fontWeight: 700 }}>
                              {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{e?.prenom} {e?.nom}</p>
                              {e?.ppr && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600" style={{ fontWeight: 600 }}>
                                  <Hash className="w-3 h-3 text-blue-400" />{e.ppr}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            {new Date(a.dateAbsence).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {q ? (
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${q.value === "matin" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`} style={{ fontWeight: 500 }}>
                              {q.emoji} {q.label}
                            </span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{a.periode}h</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap" style={{ fontWeight: 500 }}>Irrégulière</span>
                            {rowLocked && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap" style={{ fontWeight: 500 }}>
                                <Lock className="w-2.5 h-2.5" />Verrouillée
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(a)}
                              disabled={rowLocked}
                              className={`p-2 rounded-lg transition ${rowLocked ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-blue-50"}`}
                              title={rowLocked ? "Journée verrouillée" : "Modifier"}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => !rowLocked && setDeleteTarget(a)}
                              disabled={rowLocked}
                              className={`p-2 rounded-lg transition ${rowLocked ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:bg-red-50"}`}
                              title={rowLocked ? "Journée verrouillée" : "Supprimer"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(a => {
                const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
                const q = QUARTS.find(q => q.value === a.quart);
                const absDate = a.dateAbsence.split("T")[0];
                const rowLocked = isLocked(currentUser?.etaId, absDate);
                return (
                  <div key={a.id} className={`p-4 ${rowLocked ? "bg-gray-50/80" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${e?.sexe === "Féminin" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`} style={{ fontWeight: 700 }}>
                          {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }} className="text-gray-800">{e?.prenom} {e?.nom}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs text-gray-500">{new Date(a.dateAbsence).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(a)}
                          disabled={rowLocked}
                          className={`p-2 rounded-lg ${rowLocked ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-blue-50"}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => !rowLocked && setDeleteTarget(a)}
                          disabled={rowLocked}
                          className={`p-2 rounded-lg ${rowLocked ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:bg-red-50"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
                      {q && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${q.value === "matin" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`} style={{ fontWeight: 500 }}>
                          {q.emoji} {q.label}
                        </span>
                      )}
                      <span className="text-gray-700" style={{ fontWeight: 600 }}>{a.periode}h</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700" style={{ fontWeight: 500 }}>Irrégulière</span>
                      {rowLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600" style={{ fontWeight: 500 }}>
                          <Lock className="w-2.5 h-2.5" />Verrouillée
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-4">
              <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <AbsenceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }} onSave={handleSave} initial={editTarget} />

      {/* ── Confirmation Valider ── */}
      {confirmValidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmValidate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>Valider la journée ?</h3>
              <p className="text-gray-500 text-sm mb-1">
                En validant, vous <strong>ne pourrez plus créer, modifier ou supprimer</strong> d'absences pour la date d'aujourd'hui
                ({new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}).
              </p>
              <p className="text-gray-400 text-xs mb-6">Seul l'administrateur peut rétablir l'accès.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmValidate(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm"
                  style={{ fontWeight: 500 }}>Annuler</button>
                <button onClick={handleValider}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition text-sm"
                  style={{ fontWeight: 600 }}>Confirmer la validation</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>Confirmer la suppression</h3>
              <p className="text-gray-500 text-sm mb-6">Voulez-vous vraiment supprimer cette absence ? Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>Annuler</button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition text-sm" style={{ fontWeight: 600 }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
