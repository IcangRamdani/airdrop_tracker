import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ClockIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MoonIcon,
  SunIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  CalendarIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// 🔥 CONFIG FIREBASE (ISI PUNYA KAMU)
const firebaseConfig = {
  apiKey: "AIzaSyAyUDgROJvSpLCbbT3j40HwYjcY3Znk2Sc",
  authDomain: "airdrop-tracker-c88fe.firebaseapp.com",
  projectId: "airdrop-tracker-c88fe",
  storageBucket: "airdrop-tracker-c88fe.firebasestorage.app",
  messagingSenderId: "641267840674",
  appId: "1:641267840674:web:429297fdd897eb2c2049fb",
  measurementId: "G-VH97BDQ73M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper untuk koleksi per wallet
const getWalletCollection = (wallet) => collection(db, `airdrops/${wallet}/airdrops`);
const getWalletRegistryDoc = (wallet) => doc(db, "wallets", wallet);
const walletMigrationStorageKey = "airdrops_wallet_registry_migrated";
const normalizeWallets = (items = []) =>
  Array.from(
    new Set(
      items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    )
  );
const emptyFormState = {
  name: "",
  task: "",
  link: "",
  deadline: "",
  status: "Belum",
  priority: "Medium",
  category: "General",
  notes: "",
  frequency: "One-time",
  lastCompleted: null,
};
const formatDisplayDate = (value) =>
  value ? new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

const SectionCard = ({ darkMode, className = "", children }) => (
  <div
    className={`${darkMode ? "bg-slate-900/55 border-slate-700/80 shadow-slate-950/30" : "bg-white/85 border-white shadow-slate-200/80"} rounded-3xl border p-5 md:p-6 shadow-xl backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

const SectionHeading = ({ darkMode, eyebrow, title, description, action }) => (
  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div>
      {eyebrow && (
        <div className={`mb-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? "bg-slate-800 text-cyan-200" : "bg-sky-100 text-sky-700"}`}>
          {eyebrow}
        </div>
      )}
      <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{title}</h2>
      {description && <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{description}</p>}
    </div>
    {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
  </div>
);

const ActionIconButton = ({ onClick, title, children, tone = "slate", disabled = false }) => {
  const toneMap = {
    success: disabled ? "bg-slate-500/30 text-slate-300" : "bg-emerald-500 text-white hover:bg-emerald-400",
    primary: disabled ? "bg-slate-500/30 text-slate-300" : "bg-sky-500 text-white hover:bg-sky-400",
    secondary: disabled ? "bg-slate-500/30 text-slate-300" : "bg-violet-500 text-white hover:bg-violet-400",
    danger: disabled ? "bg-slate-500/30 text-slate-300" : "bg-rose-500 text-white hover:bg-rose-400",
    slate: disabled ? "bg-slate-500/30 text-slate-300" : "bg-slate-800/80 text-white hover:bg-slate-700",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl p-3 transition-all duration-200 ${toneMap[tone]} ${disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5"}`}
    >
      {children}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const classes = status === "Selesai" ? 'bg-green-100 text-green-800' : status === "Proses" ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const classes = priority === "High" ? 'bg-red-100 text-red-800' : priority === "Low" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>{priority}</span>;
};

const FrequencyBadge = ({ frequency }) => (
  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{frequency}</span>
);

const AirdropCard = ({ a, darkMode, getColor, onEdit, onDuplicate, onRemove, onToggleStatus, isCompletedToday, readOnly }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
    className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700' : 'border-white'} shadow-xl rounded-3xl p-6 border backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>{a.name}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{a.task}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={a.status} />
          <PriorityBadge priority={a.priority} />
          <FrequencyBadge frequency={a.frequency} />
        </div>
        {a.deadline && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>📅 {new Date(a.deadline).toLocaleDateString()}</p>}
        {a.wallet && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>👛 {a.wallet}</p>}
        {a.link && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>🔗 <a href={a.link} target="_blank" rel="noreferrer" className="underline hover:text-blue-400">{a.link}</a></p>}
        {a.notes && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📝 {a.notes}</p>}
      </div>
      <div className="flex flex-col gap-2 ml-4">
        <button
          onClick={() => onToggleStatus(a.id)}
          className={`${a.status === 'Selesai' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white p-2 rounded-xl transition-all duration-200`}
          title={a.status === 'Selesai' ? 'Tandai sebagai Proses' : 'Tandai sebagai Selesai'}
        >
          <CheckBadgeIcon className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(a)} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl transition-all duration-200"><PencilIcon className="w-4 h-4" /></button>
        <button onClick={() => onDuplicate(a)} className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-xl transition-all duration-200"><DocumentDuplicateIcon className="w-4 h-4" /></button>
        <button onClick={() => onRemove(a.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all duration-200"><TrashIcon className="w-4 h-4" /></button>
      </div>
    </div>
  </motion.div>
);

const DailyTaskCard = ({ a, darkMode, getColor, toggleDailyComplete, isCompletedToday }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700' : 'border-white'} shadow-lg rounded-2xl p-4 border backdrop-blur-sm`}
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{a.name}</h4>
      <button
        onClick={() => toggleDailyComplete(a.id)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isCompletedToday(a) ? 'bg-green-500 border-green-500 text-white' : `${darkMode ? 'border-gray-400 hover:border-green-400' : 'border-gray-300 hover:border-green-500'}`}`}
      >
        {isCompletedToday(a) && <CheckCircleIcon className="w-5 h-5" />}
      </button>
    </div>
    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{a.task}</p>
    <div className={`text-xs ${isCompletedToday(a) ? 'text-green-600' : 'text-orange-600'}`}>{isCompletedToday(a) ? '✅ Completed Today' : '⏰ Pending'}</div>
  </motion.div>
);

const PolishedAirdropCard = ({ a, darkMode, getColor, onEdit, onDuplicate, onRemove, onToggleStatus, isCompletedToday, readOnly }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.25 }}
    className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700/80' : 'border-white'} group h-full rounded-3xl border p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
  >
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <StatusBadge status={a.status} />
            <PriorityBadge priority={a.priority} />
            <FrequencyBadge frequency={a.frequency} />
            {isCompletedToday(a) && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}>
                Selesai hari ini
              </span>
            )}
          </div>
          <h3 className={`truncate text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.name}</h3>
          <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{a.task}</p>
        </div>
        <ActionIconButton
          onClick={() => onToggleStatus(a.id)}
          title={a.status === 'Selesai' ? 'Tandai sebagai Proses' : 'Tandai sebagai Selesai'}
          tone="success"
          disabled={readOnly}
        >
          <CheckBadgeIcon className="h-4 w-4" />
        </ActionIconButton>
      </div>

      <div className={`${darkMode ? 'bg-slate-950/35 border-white/10 text-slate-300' : 'bg-white/55 border-white/70 text-slate-600'} rounded-2xl border p-4`}>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Deadline</span>
            <span>{a.deadline ? formatDisplayDate(a.deadline) : 'Belum diatur'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Wallet</span>
            <span className="truncate text-right">{a.wallet || 'Belum dipilih'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Kategori</span>
            <span>{a.category || 'General'}</span>
          </div>
          {a.link && (
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">Link</span>
              <a href={a.link} target="_blank" rel="noreferrer" className={`max-w-[65%] truncate text-right font-medium underline underline-offset-4 ${darkMode ? 'text-cyan-300 decoration-cyan-400/40' : 'text-sky-700 decoration-sky-400/40'}`}>
                {a.link}
              </a>
            </div>
          )}
        </div>
      </div>

      {a.notes && (
        <div className={`${darkMode ? 'bg-slate-950/25 border-white/10' : 'bg-white/55 border-white/60'} rounded-2xl border p-4`}>
          <div className={`mb-1 text-xs font-semibold uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Catatan</div>
          <p className={`text-sm leading-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{a.notes}</p>
        </div>
      )}

      <div className="mt-auto grid grid-cols-3 gap-2 sm:grid-cols-4">
        <ActionIconButton onClick={() => onEdit(a)} title="Edit airdrop" tone="primary" disabled={readOnly}>
          <PencilIcon className="h-4 w-4" />
        </ActionIconButton>
        <ActionIconButton onClick={() => onDuplicate(a)} title="Duplikat airdrop" tone="secondary" disabled={readOnly}>
          <DocumentDuplicateIcon className="h-4 w-4" />
        </ActionIconButton>
        <ActionIconButton onClick={() => onRemove(a.id)} title="Hapus airdrop" tone="danger" disabled={readOnly}>
          <TrashIcon className="h-4 w-4" />
        </ActionIconButton>
        <div className={`col-span-3 hidden items-center justify-end text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'} sm:flex sm:col-span-1`}>
          {readOnly ? 'Pilih wallet untuk edit' : 'Siap dikelola'}
        </div>
      </div>
    </div>
  </motion.div>
);

const PolishedDailyTaskCard = ({ a, darkMode, getColor, toggleDailyComplete, isCompletedToday, readOnly }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25 }}
    className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700/80' : 'border-white'} rounded-3xl border p-5 shadow-xl backdrop-blur-xl`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <FrequencyBadge frequency={a.frequency} />
          {a.wallet && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-white/15 text-white/80' : 'bg-white/70 text-slate-700'}`}>
              {a.wallet}
            </span>
          )}
        </div>
        <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.name}</h4>
      </div>
      <button
        onClick={() => toggleDailyComplete(a.id)}
        disabled={readOnly}
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition-all ${
          isCompletedToday(a)
            ? 'border-emerald-400 bg-emerald-500 text-white'
            : darkMode
              ? 'border-slate-500 text-slate-100 hover:border-emerald-400'
              : 'border-slate-300 text-slate-600 hover:border-emerald-500'
        } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {isCompletedToday(a) ? <CheckCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5 opacity-40" />}
      </button>
    </div>
    <div className={`${darkMode ? 'bg-slate-950/25 border-white/10' : 'bg-white/55 border-white/60'} mt-4 rounded-2xl border p-4`}>
      <p className={`text-sm leading-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{a.task}</p>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className={`text-sm font-semibold ${isCompletedToday(a) ? 'text-emerald-300' : darkMode ? 'text-amber-200' : 'text-orange-600'}`}>
        {isCompletedToday(a) ? 'Sudah dikerjakan hari ini' : 'Belum dikerjakan hari ini'}
      </span>
      {readOnly && <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Pilih wallet untuk update</span>}
    </div>
  </motion.div>
);

function App({ page = "dashboard" }) {
  const [airdrops, setAirdrops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("All");
  const [newWallet, setNewWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletSyncError, setWalletSyncError] = useState("");
  const [airdropSyncError, setAirdropSyncError] = useState("");
  const [isWalletSyncReady, setIsWalletSyncReady] = useState(false);
  const fileInputRef = useRef(null);
  const localWalletCacheRef = useRef([]);
  const walletMigrationStateRef = useRef("idle");

  const activeTab = page === "dashboard" ? "All" : page;
  const isAnalytics = page === "analytics";
  const isCategories = page === "categories";
  const isSettings = page === "settings";
  const syncMessages = [walletSyncError, airdropSyncError].filter(Boolean);
  const isFirebaseConnected = isWalletSyncReady && syncMessages.length === 0;
  const readOnlyMode = selectedWallet === "All";
  const fieldClass = `${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:ring-cyan-500/30' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:ring-sky-500/20'} w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-4 transition-all`;
  const mutedPanelClass = darkMode ? 'bg-slate-950/30 border-white/10' : 'bg-slate-50 border-slate-200';
  const softTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const emptyForm = () => ({ ...emptyFormState });

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wallets"),
      (snapshot) => {
        const remoteWallets = normalizeWallets(
          snapshot.docs.map((walletDoc) => walletDoc.data()?.address || walletDoc.id)
        );

        let cachedWallets = localWalletCacheRef.current;
        if (cachedWallets.length === 0) {
          try {
            cachedWallets = normalizeWallets(
              JSON.parse(localStorage.getItem("airdrops_wallets") || "[]")
            );
            localWalletCacheRef.current = cachedWallets;
          } catch {
            cachedWallets = [];
          }
        }
        const hasMigratedWalletRegistry =
          localStorage.getItem(walletMigrationStorageKey) === "true";
        const shouldMigrateLegacyWallets =
          !hasMigratedWalletRegistry && remoteWallets.length === 0 && cachedWallets.length > 0;

        setWallets(shouldMigrateLegacyWallets ? cachedWallets : remoteWallets);
        setWalletSyncError("");
        setIsWalletSyncReady(true);

        if (walletMigrationStateRef.current !== "idle" || !shouldMigrateLegacyWallets) {
          if (!shouldMigrateLegacyWallets) {
            walletMigrationStateRef.current = "done";
            localStorage.setItem(walletMigrationStorageKey, "true");
          }
          return;
        }

        walletMigrationStateRef.current = "running";
        Promise.all(
          cachedWallets.map((wallet) =>
            setDoc(
              getWalletRegistryDoc(wallet),
              {
                address: wallet,
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            )
          )
        )
          .then(() => {
            walletMigrationStateRef.current = "done";
            localStorage.setItem(walletMigrationStorageKey, "true");
          })
          .catch((error) => {
            console.error("Wallet migration error:", error);
            setWalletSyncError("Daftar wallet belum berhasil dimigrasikan ke Firebase.");
            walletMigrationStateRef.current = "idle";
          });
      },
      (error) => {
        console.error("Wallet registry listener error:", error);
        setWalletSyncError("Gagal memuat daftar wallet dari Firebase. Cache lokal tetap dipakai jika tersedia.");
        setIsWalletSyncReady(true);
      }
    );

    return unsubscribe;
  }, []);

  // 🔄 realtime per wallet
  useEffect(() => {
    setAirdropSyncError("");

    if (selectedWallet === "All") {
      if (wallets.length === 0) {
        setAirdrops([]);
        return undefined;
      }

      setAirdrops((prev) => prev.filter((a) => wallets.includes(a.wallet)));

      const unsubscribes = wallets.map((wallet) =>
        onSnapshot(
          getWalletCollection(wallet),
          (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), wallet }));
            setAirdrops((prev) => {
              const filtered = prev.filter((a) => a.wallet !== wallet);
              return [...filtered, ...data];
            });
          },
          (error) => {
            console.error("Firestore listener error:", error);
            setAirdropSyncError(`Gagal sinkron data wallet ${wallet} dari Firebase.`);
          }
        )
      );

      return () => unsubscribes.forEach((unsub) => unsub());
    }

    const unsubscribe = onSnapshot(
      getWalletCollection(selectedWallet),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), wallet: selectedWallet }));
        setAirdrops(data);
      },
      (error) => {
        console.error("Firestore listener error:", error);
        setAirdropSyncError(`Gagal sinkron data wallet ${selectedWallet} dari Firebase.`);
      }
    );

    return unsubscribe;
  }, [selectedWallet, wallets]);

  // 🔔 izin notif
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 🌗 persistensi theme dark/light
  useEffect(() => {
    const savedTheme = localStorage.getItem("airdrops_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setDarkMode(savedTheme === "dark");
    } else {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("airdrops_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // 🔐 persistensi multi-wallet
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    try {
      const saved = normalizeWallets(JSON.parse(localStorage.getItem("airdrops_wallets") || "[]"));
      localWalletCacheRef.current = saved;
      if (saved.length > 0) setWallets(saved);
    } catch {
      localWalletCacheRef.current = [];
      setWallets([]);
    }
    const selected = localStorage.getItem("airdrops_selected_wallet");
    if (selected) {
      setSelectedWallet(selected);
    } else {
      // Only on first load, if no saved selection, auto-select first wallet if available
      setIsInitialized(true);
    }
  }, []);

  // Auto-select first wallet ONLY on first initialization if no wallet was saved
  useEffect(() => {
    if (isInitialized && wallets.length > 0 && selectedWallet === "All") {
      setSelectedWallet(wallets[0]);
      setIsInitialized(false);
    }
  }, [isInitialized, wallets]);

  useEffect(() => {
    localStorage.setItem("airdrops_wallets", JSON.stringify(wallets));
    localWalletCacheRef.current = wallets;
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem("airdrops_selected_wallet", selectedWallet);
  }, [selectedWallet]);

  useEffect(() => {
    if (!isWalletSyncReady || selectedWallet === "All") {
      return;
    }

    if (wallets.length > 0 && !wallets.includes(selectedWallet)) {
      setSelectedWallet(wallets[0]);
    }

    if (wallets.length === 0 && walletMigrationStateRef.current === "done") {
      setSelectedWallet("All");
    }
  }, [isWalletSyncReady, selectedWallet, wallets]);

  const addWallet = async () => {
    const address = newWallet.trim();
    if (!address) return;
    if (wallets.includes(address)) {
      alert("Wallet sudah ada");
      return;
    }
    try {
      await setDoc(
        getWalletRegistryDoc(address),
        {
          address,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setWalletSyncError("");
      setNewWallet("");
    } catch (error) {
      console.error("Error adding wallet:", error);
      setWalletSyncError("Wallet gagal disimpan ke Firebase.");
      alert("Wallet gagal disimpan ke Firebase.");
    }
  };

  const removeWallet = async (address) => {
    try {
      await deleteDoc(getWalletRegistryDoc(address));
      setWalletSyncError("");
      if (selectedWallet === address) {
        setSelectedWallet("All");
      }
    } catch (error) {
      console.error("Error removing wallet:", error);
      setWalletSyncError("Wallet gagal dihapus dari Firebase.");
      alert("Wallet gagal dihapus dari Firebase.");
    }
  };

  // notif deadline
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      airdrops.forEach((a) => {
        if (a.deadline && a.status !== "Selesai") {
          const d = new Date(a.deadline);
          const diff = (d - now) / (1000 * 60 * 60);
          if (diff > 0 && diff <= 24) {
            new Notification(`${a.name} hampir habis!`, {
              body: `Deadline: ${d.toLocaleDateString()}`,
              icon: "/vite.svg",
            });
          }
        }
      });
    };
    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [airdrops]);

  const add = async () => {
    if (!form.name.trim() || selectedWallet === "All") return;
    setLoading(true);
    try {
      await addDoc(getWalletCollection(selectedWallet), form);
      setForm(emptyForm());
      setShowForm(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
    setLoading(false);
  };

  const edit = async () => {
    if (!editingId || !form.name.trim() || selectedWallet === "All") return;
    setLoading(true);
    try {
      await updateDoc(doc(getWalletCollection(selectedWallet), editingId), form);
      setEditingId(null);
      setForm(emptyForm());
      setShowForm(false);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
    setLoading(false);
  };

  const remove = async (id) => {
    if (selectedWallet === "All") return;
    try {
      await deleteDoc(doc(getWalletCollection(selectedWallet), id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const duplicate = async (data) => {
    if (selectedWallet === "All") return;
    try {
      await addDoc(getWalletCollection(selectedWallet), { ...data, name: `${data.name} (Copy)` });
    } catch (error) {
      console.error("Error duplicating document: ", error);
    }
  };

  const toggleDailyComplete = async (id) => {
    if (selectedWallet === "All") return;
    console.log("Toggle daily complete for ID:", id);
    const airdrop = airdrops.find(a => a.id === id);
    if (!airdrop) {
      console.log("Airdrop not found");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = airdrop.lastCompleted === today;
    const newLastCompleted = isCompletedToday ? null : today;

    console.log("Current lastCompleted:", airdrop.lastCompleted, "Today:", today, "Is completed today:", isCompletedToday, "New value:", newLastCompleted);

    try {
      await updateDoc(doc(getWalletCollection(selectedWallet), id), {
        lastCompleted: newLastCompleted
      });
      console.log("Firestore update successful");
    } catch (error) {
      console.error("Error updating completion: ", error);
    }
  };

  const toggleStatus = async (id) => {
    if (selectedWallet === "All") return;
    const item = airdrops.find((a) => a.id === id);
    if (!item) return;
    const nextStatus = item.status === "Selesai" ? "Proses" : "Selesai";
    try {
      await updateDoc(doc(getWalletCollection(selectedWallet), id), { status: nextStatus });
    } catch (error) {
      console.error("Error toggling status", error);
    }
  };

  const buildBackupPayload = () => ({
    createdAt: new Date().toISOString(),
    wallet: selectedWallet,
    airdrops,
  });

  const exportBackup = () => {
    const payload = buildBackupPayload();
    const fileName = `airdrop-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveAutoBackup = () => {
    try {
      localStorage.setItem("airdrops_auto_backup", JSON.stringify(buildBackupPayload()));
      console.log("Auto-backup saved in localStorage");
    } catch (e) {
      console.error("Auto-backup failed", e);
    }
  };

  const importBackup = async (file) => {
    if (!file || selectedWallet === "All") return;
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || !Array.isArray(parsed.airdrops)) {
        alert("Format file tidak valid. Pastikan file backup JSON benar.");
        setLoading(false);
        return;
      }

      const toImport = parsed.airdrops;
      let count = 0;

      for (const item of toImport) {
        const payload = {
          ...item,
          status: item.status || "Belum",
          priority: item.priority || "Medium",
          frequency: item.frequency || "One-time",
          category: item.category || "General",
          lastCompleted: item.lastCompleted || null,
        };

        await addDoc(getWalletCollection(selectedWallet), payload);
        count += 1;
      }

      alert(`Import selesai: ${count} airdrop ditambahkan ke wallet ${selectedWallet}.`);
    } catch (error) {
      console.error("Gagal impor backup", error);
      alert("Terjadi kesalahan saat mengimpor file backup.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!autoBackup) return;

    saveAutoBackup();
    const interval = setInterval(() => {
      saveAutoBackup();
    }, 24 * 60 * 60 * 1000); // setiap 24 jam

    return () => clearInterval(interval);
  }, [autoBackup, airdrops]);

  useEffect(() => {
    const saved = localStorage.getItem("airdrops_auto_backup_setting");
    if (saved !== null) {
      setAutoBackup(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("airdrops_auto_backup_setting", String(autoBackup));
  }, [autoBackup]);


  const isCompletedToday = (airdrop) => {
    if (!airdrop.lastCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return airdrop.lastCompleted === today;
  };

  const filteredAirdrops = airdrops
    .filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.task.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || a.status === filterStatus;
      const matchesPriority = filterPriority === "All" || a.priority === filterPriority;

      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Daily" && a.frequency === "Daily") ||
        (activeTab === "Weekly" && a.frequency === "Weekly") ||
        (activeTab === "Completed" && a.status === "Selesai") ||
        (activeTab === "Upcoming" && a.deadline && new Date(a.deadline) > new Date());

      const matchesWallet = selectedWallet === "All" || (a.wallet && a.wallet === selectedWallet);

      return matchesSearch && matchesStatus && matchesPriority && matchesTab && matchesWallet;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const weight = { High: 0, Medium: 1, Low: 2 };
        return (weight[a.priority] || 3) - (weight[b.priority] || 3);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // default deadline
      const da = a.deadline ? new Date(a.deadline) : new Date("9999-12-31");
      const db = b.deadline ? new Date(b.deadline) : new Date("9999-12-31");
      return da - db;
    });

  if (sortOrder === "desc") {
    filteredAirdrops.reverse();
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterStatus !== "All" ||
    filterPriority !== "All" ||
    sortBy !== "deadline" ||
    sortOrder !== "asc";

  const resetControls = () => {
    setSearchTerm("");
    setFilterStatus("All");
    setFilterPriority("All");
    setSortBy("deadline");
    setSortOrder("asc");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openEditForm = (airdrop) => {
    setEditingId(airdrop.id);
    setForm({ ...emptyForm(), ...airdrop });
    setShowForm(true);
  };

  const isFormBlocked = loading || readOnlyMode;

  const stats = {
    total: airdrops.length,
    completed: airdrops.filter(a => a.status === "Selesai").length,
    inProgress: airdrops.filter(a => a.status === "Proses").length,
    pending: airdrops.filter(a => a.status === "Belum").length,
    dailyTasks: airdrops.filter(a => a.frequency === 'Daily').length,
    dailyCompleted: airdrops.filter(a => a.frequency === 'Daily' && isCompletedToday(a)).length,
    completionRate: airdrops.length ? Math.round((airdrops.filter(a => a.status === "Selesai").length / airdrops.length) * 100) : 0,
  };

  const getColor = (a, darkMode) => {
    if (a.priority === "High") return darkMode ? "bg-gradient-to-br from-rose-900 via-fuchsia-900 to-purple-900" : "bg-gradient-to-br from-rose-100 via-fuchsia-100 to-purple-100";
    if (a.priority === "Low") return darkMode ? "bg-gradient-to-br from-teal-900 via-cyan-900 to-sky-900" : "bg-gradient-to-br from-teal-100 via-cyan-100 to-sky-100";
    return darkMode ? "bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900" : "bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100";
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50'} transition-all duration-500`}>
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center gap-4 mb-4">
            <RocketLaunchIcon className={`w-12 h-12 ${darkMode ? 'text-cyan-300' : 'text-sky-500'}`} />
            <h1 className={`text-4xl md:text-6xl font-bold bg-gradient-to-r ${darkMode ? 'from-cyan-300 to-indigo-300' : 'from-sky-500 to-violet-500'} bg-clip-text text-transparent`}>
              Airdrop Tracker
            </h1>
          </div>
          <p className={`text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Kelola airdrop kamu dengan mudah dan efisien {selectedWallet !== "All" ? ` - Wallet: ${selectedWallet}` : " - Semua Wallet"}
          </p>
          
          {/* 👛 Wallet Selector - Visible on main header */}
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-white/60 border border-gray-200'}`}>
            <div className="flex flex-col md:flex-row gap-3 items-center justify-center flex-wrap">
              <label className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Wallet Aktif:</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-cyan-400' : 'bg-white border-gray-300 text-gray-700 focus:ring-2 focus:ring-sky-400'} focus:outline-none transition-all`}
              >
                <option value="All">Semua Wallet (lihat saja)</option>
                {wallets.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              {wallets.length === 0 && (
                <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada wallet. Tambahkan di Backup menu.</p>
              )}
            </div>
          </div>
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${isFirebaseConnected ? (darkMode ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-emerald-300 bg-emerald-50 text-emerald-700') : (darkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-700')}`}>
            {!isWalletSyncReady && "Menghubungkan aplikasi ke Firebase..."}
            {isWalletSyncReady && isFirebaseConnected && "Firebase tersambung. Daftar wallet dan airdrop sekarang disinkronkan lintas web dan Android."}
            {syncMessages.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-orange-50'} shadow-lg transition-all duration-300 hover:scale-110`}
            >
              {darkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-600" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!readOnlyMode) {
                  setShowForm(true);
                }
              }}
              disabled={readOnlyMode}
              title={readOnlyMode ? "Pilih wallet spesifik untuk menambah airdrop" : "Tambah airdrop"}
              className={`p-3 rounded-full shadow-lg transition-all duration-300 ${readOnlyMode ? 'bg-slate-400 text-white cursor-not-allowed opacity-60' : 'bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white hover:scale-110'}`}
            >
              <PlusIcon className="w-6 h-6" />
            </motion.button>
            <NavLink
              to="/"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Dashboard</NavLink>
            <NavLink
              to="/daily"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Daily</NavLink>
            <NavLink
              to="/weekly"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Weekly</NavLink>
            <NavLink
              to="/completed"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Selesai</NavLink>
            <NavLink
              to="/upcoming"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Upcoming</NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Analytics</NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Categories</NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-sky-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Backup</NavLink>
          </div>
        </motion.header>

        {/* ⚠️ Warning: No Wallet Selected or No Wallets */}
        {wallets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-1">Tambahkan wallet terlebih dahulu</h3>
                <p className="text-sm text-orange-800 mb-3">Anda belum menambahkan wallet apapun. Tambahkan wallet di menu <strong>Backup</strong> untuk mulai melacak airdrop.</p>
                <NavLink
                  to="/settings"
                  className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all"
                >
                  Buka Backup
                </NavLink>
              </div>
            </div>
          </motion.div>
        )}

        {selectedWallet === "All" && wallets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-1">Tampilan semua wallet</h3>
                <p className="text-sm text-blue-800">Anda sedang melihat <strong>semua wallet</strong>. Untuk menambah atau mengedit data, silakan pilih wallet spesifik di atas. Data yang ditampilkan adalah read-only.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total", value: stats.total, icon: ChartBarIcon, color: "from-blue-500 to-indigo-600" },
            { label: "Selesai", value: stats.completed, icon: CheckCircleIcon, color: "from-green-500 to-teal-600" },
            { label: "Proses", value: stats.inProgress, icon: ClockIcon, color: "from-yellow-500 to-orange-600" },
            { label: "Daily Done", value: `${stats.dailyCompleted}/${stats.dailyTasks}`, icon: CalendarIcon, color: "from-purple-500 to-pink-600" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${darkMode ? 'bg-slate-900/55 border-slate-700/80' : 'bg-white/85 border-white'} flex items-start gap-3 rounded-3xl border p-4 shadow-xl backdrop-blur-xl`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className={`text-sm font-medium uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                <div className={`mt-1 text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className={`mb-8 p-5 rounded-3xl ${darkMode ? 'bg-slate-900/55 border border-slate-700/80' : 'bg-white/85 border border-white'} shadow-xl backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Kekuatan Pencapaian</div>
            <div className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{stats.completionRate}% completed</div>
          </div>
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="h-2 rounded-full bg-gradient-to-r from-green-400 to-teal-500" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>

        {isAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <SectionCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                eyebrow="Overview"
                title="Analytics"
                description="Ringkasan cepat performa progress airdrop saat ini."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className={`${mutedPanelClass} rounded-2xl border p-4 ${softTextClass}`}>Total airdrop: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{stats.total}</strong></div>
                <div className={`${mutedPanelClass} rounded-2xl border p-4 ${softTextClass}`}>Selesai / Proses / Pending: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{stats.completed} / {stats.inProgress} / {stats.pending}</strong></div>
                <div className={`${mutedPanelClass} rounded-2xl border p-4 ${softTextClass}`}>Daily done: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{stats.dailyCompleted}/{stats.dailyTasks}</strong></div>
                <div className={`${mutedPanelClass} rounded-2xl border p-4 ${softTextClass}`}>Deadline 24 jam: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{airdrops.filter(a => a.deadline && a.status !== 'Selesai' && (new Date(a.deadline)-new Date())/(1000*60*60) <= 24 && (new Date(a.deadline)-new Date()) > 0).length}</strong></div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {isCategories && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <SectionCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                eyebrow="Grouping"
                title="Kategori"
                description="Lihat distribusi airdrop berdasarkan kategori yang paling sering dipakai."
              />
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(airdrops.map(a => a.category || 'General'))).map((cat) => (
                  <span key={cat} className={`${darkMode ? 'bg-slate-800 text-cyan-200' : 'bg-sky-100 text-sky-700'} rounded-full px-3 py-2 text-sm font-semibold`}>
                    {cat} ({airdrops.filter(a => (a.category||'General') === cat).length})
                  </span>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {isSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <SectionCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                eyebrow="Wallet Control"
                title="Backup dan Wallet"
                description="Kelola wallet aktif, ekspor/impor data, dan pengaturan backup otomatis dalam satu tempat."
                action={
                  <span className={`rounded-full px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                    {wallets.length} wallet
                  </span>
                }
              />
              <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${isFirebaseConnected ? (darkMode ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-emerald-300 bg-emerald-50 text-emerald-700') : (darkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-700')}`}>
                {!isWalletSyncReady && "Status Firebase: menghubungkan..."}
                {isWalletSyncReady && isFirebaseConnected && "Status Firebase: tersambung dan siap sinkron."}
                {syncMessages.map((message) => (
                  <div key={`settings-${message}`}>{message}</div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
                <div className={`${mutedPanelClass} rounded-2xl border p-4`}>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Wallet aktif</label>
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="All">Semua Wallet</option>
                    {wallets.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className={`${mutedPanelClass} rounded-2xl border p-4`}>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Tambah wallet baru</label>
                  <div className="grid gap-3">
                    <input
                      type="text"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="Masukkan alamat wallet"
                      className={fieldClass}
                    />
                    <button onClick={addWallet} className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition-all hover:bg-sky-600">
                      Tambahkan Wallet
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={exportBackup} className="rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-600">Export Backup</button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
                >
                  Import Backup
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importBackup(file);
                    if (e.target) e.target.value = "";
                  }}
                />
                <label className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                  <input type="checkbox" checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} className="h-4 w-4" />
                  Aktifkan Auto Backup 24h
                </label>
              </div>
              <div className="mt-5 space-y-3">
                {wallets.length === 0 && (
                  <div className={`${mutedPanelClass} rounded-2xl border border-dashed p-5 text-sm ${softTextClass}`}>
                    Belum ada wallet terdaftar. Tambahkan wallet untuk mulai melacak airdrop per wallet.
                  </div>
                )}
                {wallets.map((address) => (
                  <div key={address} className={`${mutedPanelClass} flex items-center justify-between rounded-2xl border px-4 py-3 ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    <span className="truncate">{address}</span>
                    <button onClick={() => removeWallet(address)} className="rounded-full px-3 py-1 text-sm font-semibold text-rose-500 transition-all hover:bg-rose-500/10">
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Daily Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8"
        >
          <SectionCard darkMode={darkMode}>
            <SectionHeading
              darkMode={darkMode}
              eyebrow="Daily Focus"
              title="Rutinitas Harian"
              description="Pantau airdrop yang perlu disentuh setiap hari tanpa harus mencari satu per satu."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {airdrops.filter(a => a.frequency === 'Daily').map((a) => (
                <PolishedDailyTaskCard
                  key={`daily-${a.id}`}
                  a={a}
                  darkMode={darkMode}
                  getColor={getColor}
                  toggleDailyComplete={toggleDailyComplete}
                  isCompletedToday={isCompletedToday}
                  readOnly={readOnlyMode}
                />
              ))}
              {airdrops.filter(a => a.frequency === 'Daily').length === 0 && (
                <div className={`${mutedPanelClass} rounded-2xl border border-dashed p-8 text-center ${softTextClass}`}>
                  <CalendarIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p className="font-semibold">Belum ada task harian</p>
                  <p className="mt-2 text-sm">Tambahkan airdrop dengan frekuensi harian untuk mulai melacak progres.</p>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>

        {/* Search & Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className={`${darkMode ? 'bg-slate-900/50 border-slate-700/80' : 'bg-white/85 border-white'} mb-8 rounded-3xl border p-4 md:p-5 shadow-xl backdrop-blur-xl`}
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className={`mb-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'bg-slate-800 text-cyan-200' : 'bg-sky-100 text-sky-700'}`}>
                <FunnelIcon className="h-4 w-4" />
                Filter Panel
              </div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Cari dan rapikan daftar airdrop</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Semua kontrol pencarian, status, prioritas, dan urutan ada di satu tempat.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                {filteredAirdrops.length} hasil
              </span>
              <span className={`rounded-full px-3 py-2 text-sm ${darkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                Urut: {sortBy === "deadline" ? "Deadline" : sortBy === "priority" ? "Prioritas" : "Nama"} {sortOrder === "asc" ? "naik" : "turun"}
              </span>
              <button
                onClick={resetControls}
                disabled={!hasActiveFilters}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${hasActiveFilters ? (darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-sky-500 text-white hover:bg-sky-600') : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}
              >
                <ArrowPathIcon className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-2">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama airdrop atau task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${fieldClass} pl-11`}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={fieldClass}
            >
              <option value="All">Semua Status</option>
              <option value="Belum">Belum</option>
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={fieldClass}
            >
              <option value="All">Semua Prioritas</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={fieldClass}
              >
                <option value="deadline">Deadline</option>
                <option value="priority">Prioritas</option>
                <option value="name">Nama</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={fieldClass}
              >
                <option value="asc">Naik</option>
                <option value="desc">Turun</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Airdrop List */}
        <motion.div
          layout
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredAirdrops.map((a) => (
              <PolishedAirdropCard
                key={a.id}
                a={a}
                darkMode={darkMode}
                getColor={getColor}
                onEdit={openEditForm}
                onDuplicate={duplicate}
                onRemove={remove}
                onToggleStatus={toggleStatus}
                isCompletedToday={isCompletedToday}
                readOnly={readOnlyMode}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        {filteredAirdrops.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${darkMode ? 'bg-slate-900/55 border-slate-700 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-600'} mt-6 rounded-3xl border border-dashed p-8 text-center shadow-lg`}
          >
            <FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-60" />
            <h3 className={`mb-2 text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Belum ada hasil yang cocok</h3>
            <p className="mb-4 text-sm">Coba longgarkan pencarian atau reset filter untuk menampilkan semua airdrop lagi.</p>
            <button
              onClick={resetControls}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset Filter
            </button>
          </motion.div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border p-5 shadow-2xl md:p-8`}
              onClick={(e) => e.stopPropagation()}
            >
              <SectionHeading
                darkMode={darkMode}
                eyebrow={editingId ? "Edit Mode" : "Airdrop Baru"}
                title={editingId ? "Perbarui detail airdrop" : "Tambah airdrop baru"}
                description={readOnlyMode ? "Pilih wallet spesifik lebih dulu agar data bisa disimpan ke Firebase." : `Data akan disimpan ke wallet ${selectedWallet}.`}
              />

              {readOnlyMode && (
                <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Mode semua wallet bersifat read-only. Pilih wallet spesifik di header atau menu backup sebelum menambah atau mengedit data.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Nama Airdrop</label>
                  <input
                    type="text"
                    placeholder="Contoh: Monad Testnet"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Deskripsi Task</label>
                  <textarea
                    placeholder="Jelaskan langkah yang perlu dilakukan"
                    value={form.task}
                    onChange={(e) => setForm({ ...form, task: e.target.value })}
                    className={fieldClass}
                    rows="4"
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Kategori</label>
                  <input
                    type="text"
                    placeholder="General, Testnet, Social"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="Belum">Belum</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Prioritas</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Frekuensi</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="One-time">One-time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Link</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-sm font-semibold ${softTextClass}`}>Catatan</label>
                  <textarea
                    placeholder="Tambahan informasi, reward, atau catatan penting"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={fieldClass}
                    rows="3"
                  />
                </div>
              </div>

              <div className={`${mutedPanelClass} mt-5 rounded-2xl border px-4 py-3 text-sm ${softTextClass}`}>
                Wallet tujuan: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{readOnlyMode ? 'Belum dipilih' : selectedWallet}</strong>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closeForm}
                  className={`${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-2xl px-5 py-3 font-semibold transition-all duration-200`}
                >
                  Tutup
                </button>
                <button
                  onClick={editingId ? edit : add}
                  disabled={isFormBlocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold text-white transition-all duration-300 ${isFormBlocked ? 'cursor-not-allowed bg-slate-400 opacity-70' : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 hover:-translate-y-0.5'}`}
                >
                  <PlusIcon className="w-5 h-5" />
                  {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Airdrop'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
