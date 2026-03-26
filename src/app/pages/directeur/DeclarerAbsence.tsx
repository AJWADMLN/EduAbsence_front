import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import Pagination from "../../components/Pagination";
import { CheckCircle, ClipboardList, Search, AlertCircle, Hash, Clock, Calendar, Building2, Lock, ShieldCheck } from "lucide-react";
import { useDayLock } from "../../hooks/useDayLock";

const TEACHERS_PER_PAGE = 5;
const HISTORY_PER_PAGE  = 5;

type QuartValue = "matin" | "soir";

const QUARTS: { value: QuartValue; label: string; emoji: string; start: number; end: number; color: string }[] = [
  { value: "matin", label: "Matin", emoji: "🌅", start: 9,  end: 13, color: "amber"  },
  { value: "soir",  label: "Soir",  emoji: "🌆", start: 15, end: 19, color: "indigo" },
];

export default function DeclarerAbsence() {
  const { enseignants, absences, addAbsence, currentUser, etablissements } = useApp();
  const { isLocked } = useDayLock();

  // Scope to directeur's establishment
  const myTeachers = enseignants.filter(e => e.etaId === currentUser?.etaId);
  const myPprs     = new Set(myTeachers.map(e => e.ppr));
  const eta        = etablissements.find(e => e.id === currentUser?.etaId);

  const today = new Date().toISOString().split("T")[0];

  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState<number>(0);  // ppr as number
  const [quart,      setQuart]      = useState<QuartValue>("matin");
  const [periode,    setPeriode]    = useState<number>(4);   // 1-4 hours
  const [date,       setDate]       = useState<string>(today);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const [teacherPage, setTeacherPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const filtered = myTeachers.filter(e =>
    `${e.nom} ${e.prenom} ${e.matiere || ""} ${e.ppr}`.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedTeachers = filtered.slice(
    (teacherPage - 1) * TEACHERS_PER_PAGE,
    teacherPage * TEACHERS_PER_PAGE
  );

  const historyAll = [...absences]
    .filter(a => myPprs.has(a.enseignantPpr))
    .sort((a, b) => b.dateAbsence.localeCompare(a.dateAbsence));

  const paginatedHistory = historyAll.slice(
    (historyPage - 1) * HISTORY_PER_PAGE,
    historyPage * HISTORY_PER_PAGE
  );

  const alreadyAbsent = Boolean(
    selected && absences.some(a => a.enseignantPpr === selected && a.dateAbsence === date)
  );

  const selectedEns  = myTeachers.find(e => e.ppr === selected);
  const quartInfo    = QUARTS.find(q => q.value === quart)!;
  const maxH         = quartInfo.end - quartInfo.start;
  const heuresOpts   = Array.from({ length: maxH }, (_, i) => {
    const h = i + 1;
    return { value: h, label: `${h}h`, range: `${quartInfo.start}h00 – ${quartInfo.start + h}h00` };
  });
  const selectedRange = heuresOpts.find(o => o.value === periode)?.range ?? "";

  const handleQuartChange = (q: QuartValue) => { setQuart(q); setPeriode(Math.min(periode, QUARTS.find(x => x.value === q)!.end - QUARTS.find(x => x.value === q)!.start)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selected) { setError("Veuillez sélectionner un enseignant."); return; }
    if (!date)     { setError("Veuillez choisir une date."); return; }
    if (isLocked(currentUser?.etaId, date)) {
      setError("La journée du " + new Date(date + "T00:00:00").toLocaleDateString("fr-FR") + " a été validée. Vous ne pouvez plus déclarer d'absences pour cette date.");
      return;
    }
    if (alreadyAbsent) { setError("Cet enseignant a déjà une absence enregistrée pour ce jour."); return; }

    try {
      await addAbsence({
        enseignantPpr: Number(selected),
        etaId:         currentUser?.etaId ?? 0,
        dateAbsence:   date,
        quart,
        periode,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setSelected(0); setSearch(""); setDate(today); }, 3500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Une erreur est survenue.";
      setError(msg);
    }
  };

  const todayLocked = isLocked(currentUser?.etaId, today);
  const dateIsLocked = date ? isLocked(currentUser?.etaId, date) : false;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Déclarer une absence</h2>
        <p className="text-gray-500 text-sm">Signalez une absence irrégulière d'un enseignant</p>
        {eta && (
          <div className="flex items-center gap-2 mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 w-fit">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span style={{ fontWeight: 600 }}>{eta.nom}</span>
            <span className="text-blue-400">— {myTeachers.length} enseignant{myTeachers.length > 1 ? "s" : ""}</span>
          </div>
        )}
        {todayLocked && (
          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 w-fit">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span style={{ fontWeight: 600 }}>La journée d'aujourd'hui est validée — création d'absence bloquée</span>
          </div>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm" style={{ fontWeight: 500 }}>
            Absence déclarée pour{" "}
            <strong>{selectedEns?.prenom} {selectedEns?.nom}</strong> —{" "}
            {quartInfo.emoji} {quartInfo.label} • <strong>{periode}h</strong> ({selectedRange})
          </p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Sélection enseignant */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-gray-700 mb-3" style={{ fontWeight: 600 }}>
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Sélectionner l'enseignant
            </span>
          </label>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search}
              onChange={e => { setSearch(e.target.value); setTeacherPage(1); }}
              placeholder="Rechercher par nom, matière ou PPR…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div className="space-y-2 rounded-xl">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Aucun enseignant trouvé</p>
            ) : (
              paginatedTeachers.map(e => {
                const absCount = absences.filter(a => a.enseignantPpr === e.ppr).length;
                const isSelected = selected === e.ppr;
                return (
                  <button key={e.ppr} type="button" onClick={() => setSelected(e.ppr)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition border-2 ${isSelected ? "border-blue-500 bg-blue-50" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`} style={{ fontWeight: 700 }}>
                      {e.prenom.charAt(0)}{e.nom.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm truncate ${isSelected ? "text-blue-800" : "text-gray-800"}`} style={{ fontWeight: 600 }}>
                          {e.prenom} {e.nom}
                        </p>
                        {e.ppr && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${isSelected ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-gray-100 border-gray-200 text-gray-600"}`} style={{ fontWeight: 600 }}>
                            <Hash className="w-3 h-3" />{e.ppr}
                          </span>
                        )}
                      </div>
                      {e.matiere && <p className={`text-xs ${isSelected ? "text-blue-600" : "text-gray-500"}`}>{e.matiere}</p>}
                      {e.sexe && <SexeBadge sexe={e.sexe} isSelected={isSelected} />}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${absCount === 0 ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`} style={{ fontWeight: 600 }}>
                      {absCount} abs.
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {filtered.length > TEACHERS_PER_PAGE && (
            <div className="mt-2">
              <Pagination total={filtered.length} page={teacherPage} perPage={TEACHERS_PER_PAGE} onChange={setTeacherPage} />
            </div>
          )}
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="flex items-center gap-2 text-gray-700 mb-3" style={{ fontWeight: 600 }}>
            <Calendar className="w-4 h-4 text-blue-500" />Date de l'absence
          </label>
          <input type="date" value={date} max={today}
            onChange={e => setDate(e.target.value)} required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {date && (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-blue-400" />
              {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {date === today && <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full" style={{ fontWeight: 600 }}>Aujourd'hui</span>}
            </p>
          )}
        </div>

        {/* Quart + Heures */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-red-800 text-sm" style={{ fontWeight: 700 }}>Absence irrégulière</p>
              <p className="text-red-500 text-xs">Type d'absence automatiquement défini</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-3" style={{ fontWeight: 600 }}>
              <Clock className="w-4 h-4 text-blue-500" />Quart d'absence
            </label>
            <div className="grid grid-cols-2 gap-3">
              {QUARTS.map(q => {
                const isActive = quart === q.value;
                const activeClass = q.color === "amber" ? "border-amber-500 bg-amber-50" : "border-indigo-500 bg-indigo-50";
                const textClass = q.color === "amber" ? "text-amber-800" : "text-indigo-800";
                return (
                  <button key={q.value} type="button" onClick={() => handleQuartChange(q.value)}
                    className={`flex flex-col items-center gap-1 px-4 py-4 rounded-xl border-2 transition ${isActive ? activeClass : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                    <span style={{ fontSize: "1.75rem" }}>{q.emoji}</span>
                    <span className={`text-sm ${isActive ? textClass : "text-gray-700"}`} style={{ fontWeight: 700 }}>{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-3" style={{ fontWeight: 600 }}>
              <Clock className="w-4 h-4 text-purple-500" />
              Nombre d'heures
              <span className="text-xs text-gray-400" style={{ fontWeight: 400 }}>({quartInfo.label} : max {maxH}h)</span>
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
            <div className="mt-3 flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-purple-800 text-sm" style={{ fontWeight: 700 }}>
                {quartInfo.emoji} {quartInfo.label} — <span>{periode}h d'absence</span>
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu */}
        {selected && (
          <div className={`rounded-2xl border p-4 ${alreadyAbsent ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
            <p className={`text-sm ${alreadyAbsent ? "text-red-700" : "text-blue-700"}`} style={{ fontWeight: 500 }}>
              {alreadyAbsent ? (
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {selectedEns?.prenom} {selectedEns?.nom} a déjà une absence enregistrée pour ce jour.
                </span>
              ) : (
                <span>
                  📋 <strong>{selectedEns?.prenom} {selectedEns?.nom}</strong>
                  {selectedEns?.matiere && ` (${selectedEns.matiere})`} —{" "}
                  <strong>Absence irrégulière</strong> — {quartInfo.emoji} <strong>{quartInfo.label}</strong>{" "}
                  — <strong>{periode}h</strong>{" "}
                  le <strong>{date ? new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}</strong>
                </span>
              )}
            </p>
          </div>
        )}

        <button type="submit"
          disabled={!selected || !date || alreadyAbsent || dateIsLocked}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl transition shadow-sm"
          style={{ fontWeight: 600 }}>
          {dateIsLocked
            ? <><Lock className="w-5 h-5" />Journée verrouillée</>
            : <><CheckCircle className="w-5 h-5" />Confirmer l'absence irrégulière ({periode}h)</>}
        </button>
      </form>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>
          Historique des absences
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full" style={{ fontWeight: 500 }}>{historyAll.length}</span>
        </h3>

        <div className="space-y-2">
          {historyAll.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Aucune absence déclarée.</p>
          ) : (
            paginatedHistory.map(a => {
              const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
              const q = QUARTS.find(q => q.value === a.quart);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                    {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{e?.prenom} {e?.nom}</p>
                      {e?.ppr && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600" style={{ fontWeight: 600 }}>
                          <Hash className="w-3 h-3 text-blue-400" />{e.ppr}
                        </span>
                      )}
                    </div>
                    {e?.matiere && <p className="text-xs text-gray-500">{e.matiere}</p>}
                    {e?.sexe && <SexeBadge sexe={e.sexe} />}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-gray-500">{new Date(a.dateAbsence).toLocaleDateString("fr-FR")}</p>
                    {q && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${q.value === "matin" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`} style={{ fontWeight: 500 }}>
                        {q.emoji} {q.label} · {a.periode}h
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap" style={{ fontWeight: 500 }}>Irrégulière</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {historyAll.length > HISTORY_PER_PAGE && (
          <Pagination total={historyAll.length} page={historyPage} perPage={HISTORY_PER_PAGE} onChange={setHistoryPage} />
        )}
      </div>
    </div>
  );
}

function SexeBadge({ sexe, isSelected = false }: { sexe: string; isSelected?: boolean }) {
  const isMasc = sexe === "Masculin";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      isSelected
        ? (isMasc ? "bg-blue-200 text-blue-800" : "bg-pink-200 text-pink-800")
        : (isMasc ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700")
    }`} style={{ fontWeight: 500 }}>
      {isMasc ? "👨" : "👩"} {sexe}
    </span>
  );
}