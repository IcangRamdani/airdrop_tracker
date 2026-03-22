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
  TagIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  SparklesIcon,
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

const AirdropCard = ({ a, darkMode, getColor, onEdit, onDuplicate, onRemove, onToggleStatus, isCompletedToday }) => (
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
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
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


  const [form, setForm] = useState({
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
  });

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
      setForm({
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
      });
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
      setForm({
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
      });
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

      const isUrgent = a.deadline && a.status !== "Selesai" && (new Date(a.deadline) - new Date()) / (1000 * 60 * 60) <= 24 && (new Date(a.deadline) - new Date()) > 0;

      return matchesSearch && matchesStatus && matchesPriority && matchesTab && matchesWallet && (!showUrgentOnly || isUrgent);
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
              <label className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>👛 Pilih Wallet:</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-cyan-400' : 'bg-white border-gray-300 text-gray-700 focus:ring-2 focus:ring-sky-400'} focus:outline-none transition-all`}
              >
                <option value="All">📋 Semua Wallet (View Only)</option>
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
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
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
                <h3 className="font-bold text-orange-900 mb-1">🔑 Tambah Wallet Terlebih Dahulu</h3>
                <p className="text-sm text-orange-800 mb-3">Anda belum menambahkan wallet apapun. Tambahkan wallet di menu <strong>Backup</strong> untuk mulai melacak airdrop.</p>
                <NavLink
                  to="/settings"
                  className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all"
                >
                  ➜ Buka Menu Backup
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
                <h3 className="font-bold text-blue-900 mb-1">📋 Mode Tampilan Semua Wallet</h3>
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
              className={`${darkMode ? 'bg-slate-800/50 backdrop-blur-sm border-slate-700' : 'bg-white/80 backdrop-blur-sm border-white'} shadow-xl rounded-2xl p-4 border text-center`}
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stat.value}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className={`mb-8 p-4 rounded-2xl ${darkMode ? 'bg-slate-800/55 border border-slate-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Kekuatan Pencapaian</div>
            <div className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.completionRate}% Completed</div>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-gradient-to-r from-green-400 to-teal-500" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>

        {isAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? 'bg-slate-800/60' : 'bg-white/70'} rounded-2xl p-4 mb-8 border border-dashed`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Analytics</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total airdrop: {stats.total}</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed: {stats.completed}, In-progress: {stats.inProgress}, Pending: {stats.pending}</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Daily done: {stats.dailyCompleted}/{stats.dailyTasks}</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Urgent (deadline 24h): {airdrops.filter(a => a.deadline && a.status !== 'Selesai' && (new Date(a.deadline)-new Date())/(1000*60*60) <= 24 && (new Date(a.deadline)-new Date()) > 0).length}</p>
          </motion.div>
        )}

        {isCategories && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? 'bg-slate-800/60' : 'bg-white/70'} rounded-2xl p-4 mb-8 border border-dashed`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏷️ Categories</h2>
            {Array.from(new Set(airdrops.map(a => a.category || 'General'))).map((cat) => (
              <span key={cat} className="inline-block px-3 py-1 mr-2 mb-2 rounded-full bg-indigo-100 text-indigo-700 text-sm">{cat} ({airdrops.filter(a => (a.category||'General') === cat).length})</span>
            ))}
          </motion.div>
        )}

        {isSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? 'bg-slate-800/60' : 'bg-white/70'} rounded-2xl p-4 mb-8 border border-dashed`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>🗄️ Backup & Wallet</h2>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{wallets.length} wallet(s) tersimpan</span>
            </div>
            <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${isFirebaseConnected ? (darkMode ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-emerald-300 bg-emerald-50 text-emerald-700') : (darkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-700')}`}>
              {!isWalletSyncReady && "Status Firebase: menghubungkan..."}
              {isWalletSyncReady && isFirebaseConnected && "Status Firebase: tersambung dan siap sinkron."}
              {syncMessages.map((message) => (
                <div key={`settings-${message}`}>{message}</div>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>Pilih Wallet Aktif:</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                <option value="All">All</option>
                {wallets.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="text"
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                placeholder="Tambah wallet baru"
                className={`col-span-2 w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
              />
              <button onClick={addWallet} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold">Tambahkan</button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 items-center mb-3">
                <button onClick={exportBackup} className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold">Export Backup</button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold"
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
                <label className={`flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <input type="checkbox" checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} className="w-4 h-4" />
                  Aktifkan Auto Backup 24h
                </label>
              </div>
              {wallets.length === 0 && (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Belum ada wallet terdaftar. Tambahkan untuk melacak airdrop per wallet.</p>
              )}
              {wallets.map((address) => (
                <div key={address} className={`${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-gray-700 border-gray-200'} flex items-center justify-between rounded-lg border px-3 py-2`}>
                  <span className="truncate">{address}</span>
                  <button onClick={() => removeWallet(address)} className="text-red-500 hover:text-red-700">Hapus</button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Daily Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8"
        >
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📅 Daily Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {airdrops.filter(a => a.frequency === 'Daily').map((a) => (
              <DailyTaskCard
                key={`daily-${a.id}`}
                a={a}
                darkMode={darkMode}
                getColor={getColor}
                toggleDailyComplete={toggleDailyComplete}
                isCompletedToday={isCompletedToday}
              />
            ))}
            {airdrops.filter(a => a.frequency === 'Daily').length === 0 && (
              <div className={`${darkMode ? 'bg-slate-800/50 text-gray-400' : 'bg-white/50 text-gray-500'} rounded-2xl p-8 text-center border border-dashed`}>
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No daily tasks yet</p>
                <p className="text-sm">Add a daily airdrop to get started!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Search & Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col xl:flex-row gap-4 mb-8"
        >
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari airdrop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
          >
            <option value="All">Semua Status</option>
            <option value="Belum">Belum</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
          >
            <option value="All">Semua Prioritas</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
          >
            <option value="deadline">Urutkan: Deadline</option>
            <option value="priority">Urutkan: Prioritas</option>
            <option value="name">Urutkan: Nama</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            className={`px-4 py-3 rounded-xl font-semibold transition-all ${showUrgentOnly ? 'bg-red-500 text-white' : darkMode ? 'bg-slate-700 text-white border border-slate-600' : 'bg-white text-gray-700 border border-gray-200'}`}
            title="Tampilkan hanya airdrop deadline 24 jam"
          >
            <SparklesIcon className="w-4 h-4 inline mr-2" />{showUrgentOnly ? 'Urgent ON' : 'Urgent OFF'}
          </button>
        </motion.div>

        {/* Airdrop List */}
        <motion.div
          layout
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredAirdrops.map((a) => (
              <AirdropCard
                key={a.id}
                a={a}
                darkMode={darkMode}
                getColor={getColor}
                onEdit={(airdrop) => {
                  setEditingId(airdrop.id);
                  setForm(airdrop);
                  setShowForm(true);
                }}
                onDuplicate={duplicate}
                onRemove={remove}
                onToggleStatus={toggleStatus}
                isCompletedToday={isCompletedToday}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-3xl p-4 md:p-8 border shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {editingId ? 'Edit Airdrop' : 'Tambah Airdrop'}
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Airdrop"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                />
                <textarea
                  placeholder="Deskripsi Task"
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                  rows="3"
                />
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                >
                  <option value="Belum">Belum</option>
                  <option value="Proses">Proses</option>
                  <option value="Selesai">Selesai</option>
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                >
                  <option value="One-time">One-time</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
                <input
                  type="text"
                  placeholder="Category (opsional)"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                />
                <input
                  type="text"
                  placeholder="Link Airdrop (opsional)"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                />
                <textarea
                  placeholder="Notes (opsional)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
                  rows="2"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={editingId ? edit : add}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700'} flex items-center justify-center gap-2`}
                >
                  {loading ? 'Menyimpan...' : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      {editingId ? 'Update' : 'Tambah'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({
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
                    });
                  }}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
                >
                  Batal
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
