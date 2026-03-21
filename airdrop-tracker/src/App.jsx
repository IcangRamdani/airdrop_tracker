import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  CheckCircleIcon,
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

function App({ page = "dashboard" }) {
  const [airdrops, setAirdrops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [loading, setLoading] = useState(false);

  const activeTab = page === "dashboard" ? "All" : page;
  const isAnalytics = page === "analytics";
  const isCategories = page === "categories";
  const isSettings = page === "settings";


  const [form, setForm] = useState({
    name: "",
    task: "",
    wallet: "",
    link: "",
    deadline: "",
    status: "Belum",
    priority: "Medium",
    category: "General",
    notes: "",
    frequency: "One-time",
    lastCompleted: null,
  });

  // 🔄 realtime
  useEffect(() => {
    console.log("Setting up Firestore listener");
    const unsubscribe = onSnapshot(collection(db, "airdrops"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Received data from Firestore:", data);
      setAirdrops(data);
    }, (error) => {
      console.error("Firestore listener error:", error);
    });
    return unsubscribe;
  }, []);

  // 🔔 izin notif
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "airdrops"), form);
      setForm({
        name: "",
        task: "",
        wallet: "",
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
    if (!editingId || !form.name.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "airdrops", editingId), form);
      setEditingId(null);
      setForm({
        name: "",
        task: "",
        wallet: "",
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
    try {
      await deleteDoc(doc(db, "airdrops", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const duplicate = async (data) => {
    try {
      await addDoc(collection(db, "airdrops"), { ...data, name: `${data.name} (Copy)` });
    } catch (error) {
      console.error("Error duplicating document: ", error);
    }
  };

  const toggleDailyComplete = async (id) => {
    console.log("Toggle daily complete for ID:", id);
    const airdrop = airdrops.find(a => a.id === id);
    if (!airdrop) {
      console.log("Airdrop not found");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = airdrop.lastCompleted === today;
    const newLastCompleted = isCompletedToday ? null : new Date().toISOString();

    console.log("Current lastCompleted:", airdrop.lastCompleted, "Today:", today, "Is completed today:", isCompletedToday, "New value:", newLastCompleted);

    try {
      await updateDoc(doc(db, "airdrops", id), {
        lastCompleted: newLastCompleted
      });
      console.log("Firestore update successful");
    } catch (error) {
      console.error("Error updating completion: ", error);
    }
  };

  const isCompletedToday = (airdrop) => {
    if (!airdrop.lastCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return airdrop.lastCompleted === today;
  };

  const filteredAirdrops = airdrops.filter((a) => {
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

    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  const stats = {
    total: airdrops.length,
    completed: airdrops.filter(a => a.status === "Selesai").length,
    inProgress: airdrops.filter(a => a.status === "Proses").length,
    pending: airdrops.filter(a => a.status === "Belum").length,
    dailyTasks: airdrops.filter(a => a.frequency === 'Daily').length,
    dailyCompleted: airdrops.filter(a => a.frequency === 'Daily' && isCompletedToday(a)).length,
  };

  const getColor = (a, darkMode) => {
    if (a.priority === "High") return darkMode ? "bg-gradient-to-br from-red-900 to-pink-900" : "bg-gradient-to-br from-red-100 to-pink-100";
    if (a.priority === "Low") return darkMode ? "bg-gradient-to-br from-green-900 to-teal-900" : "bg-gradient-to-br from-green-100 to-teal-100";
    return darkMode ? "bg-gradient-to-br from-blue-900 to-indigo-900" : "bg-gradient-to-br from-blue-100 to-indigo-100";
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-orange-100 via-pink-50 to-yellow-100'} transition-all duration-500`}>
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center gap-4 mb-4">
            <RocketLaunchIcon className={`w-12 h-12 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <h1 className={`text-4xl md:text-6xl font-bold bg-gradient-to-r ${darkMode ? 'from-orange-400 to-pink-400' : 'from-orange-600 to-pink-600'} bg-clip-text text-transparent`}>
              Airdrop Tracker
            </h1>
          </div>
          <p className={`text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Kelola airdrop kamu dengan mudah dan efisien
          </p>
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
              className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            >
              <PlusIcon className="w-6 h-6" />
            </motion.button>
            <NavLink
              to="/"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Dashboard</NavLink>
            <NavLink
              to="/daily"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Daily</NavLink>
            <NavLink
              to="/weekly"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Weekly</NavLink>
            <NavLink
              to="/completed"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Selesai</NavLink>
            <NavLink
              to="/upcoming"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Upcoming</NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Analytics</NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Categories</NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/60 text-gray-700'} transition-all`}
            >Settings</NavLink>
          </div>
        </motion.header>

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
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>⚙️ Settings</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>- Toggle dark mode</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>- Filter airdrop by status / priority</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>- Manage your daily/weekly tasks</p>
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
            {airdrops.filter(a => a.frequency === 'Daily').map((a, index) => (
              <motion.div
                key={`daily-${a.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700' : 'border-white'} shadow-lg rounded-2xl p-4 border backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{a.name}</h4>
                  <button
                    onClick={() => toggleDailyComplete(a.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompletedToday(a) 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : `${darkMode ? 'border-gray-400 hover:border-green-400' : 'border-gray-300 hover:border-green-500'}`
                    }`}
                  >
                    {isCompletedToday(a) && <CheckCircleIcon className="w-5 h-5" />}
                  </button>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{a.task}</p>
                <div className={`text-xs ${isCompletedToday(a) ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCompletedToday(a) ? '✅ Completed Today' : '⏰ Pending'}
                </div>
              </motion.div>
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
          className="flex flex-col md:flex-row gap-4 mb-8"
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
        </motion.div>

        {/* Airdrop List */}
        <motion.div
          layout
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredAirdrops.map((a, index) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${getColor(a, darkMode)} ${darkMode ? 'border-slate-700' : 'border-white'} shadow-xl rounded-3xl p-6 border backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>{a.name}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{a.task}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === "Selesai" ? 'bg-green-100 text-green-800' :
                        a.status === "Proses" ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {a.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.priority === "High" ? 'bg-red-100 text-red-800' :
                        a.priority === "Low" ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {a.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                        {a.frequency}
                      </span>
                    </div>
                    {a.deadline && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                        📅 {new Date(a.deadline).toLocaleDateString()}
                      </p>
                    )}
                    {a.wallet && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                        👛 {a.wallet}
                      </p>
                    )}
                    {a.link && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                        🔗 <a href={a.link} target="_blank" rel="noreferrer" className="underline hover:text-blue-400">{a.link}</a>
                      </p>
                    )}
                    {a.notes && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        📝 {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingId(a.id);
                        setForm(a);
                        setShowForm(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl transition-all duration-200"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicate(a)}
                      className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-xl transition-all duration-200"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
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
                  type="text"
                  placeholder="Wallet Address (opsional)"
                  value={form.wallet}
                  onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-orange-500' : 'bg-white border-gray-200 focus:ring-orange-500'}`}
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
                      wallet: "",
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
