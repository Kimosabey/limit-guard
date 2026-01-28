"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import GeoMap from '../components/GeoMap';
import RulesManager from '../components/RulesManager';

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }
};

export default function Dashboard() {
  const [data, setData] = useState([]); // Dynamic History
  const [metrics, setMetrics] = useState({
    total: 0,
    passRate: 100,
    blockRate: 0,
    latency: '<1',
    redisStatus: 'Connecting...',
    uptime: 0,
    geo: {}
  });
  const [rules, setRules] = useState({ global: { limit: 10, window: 60 } });
  const [isAttacking, setIsAttacking] = useState(false);

  // Timer State
  const [resetTime, setResetTime] = useState(null); // Timestamp when window resets
  const [timeLeft, setTimeLeft] = useState(0);

  // Poll for real-time status every 2 seconds
  const fetchStatus = async () => {
    try {
      const res = await axios.get(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api/test', '')}/api/status` : 'http://localhost:8800/api/status');
      if (res.data.success) {
        setMetrics(prev => ({
          ...prev,
          total: res.data.metrics.total,
          passRate: res.data.metrics.passRate,
          blockRate: res.data.metrics.blockRate,
          redisStatus: res.data.system.redisStatus,
          uptime: res.data.system.uptime,
          latency: res.data.system.latency || '<1',
          geo: res.data.metrics.geo || {}
        }));

        if (res.data.rules) {
          setRules(res.data.rules);
        }

        // Only update chart if we have history
        if (res.data.history && res.data.history.length > 0) {
          setData(res.data.history);
        }
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
      setMetrics(prev => ({ ...prev, redisStatus: 'Error' }));
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    if (!resetTime) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((resetTime - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [resetTime]);

  // Helper to sync timer from headers
  const syncTimer = (headers) => {
    const ttl = headers['x-ratelimit-reset']; // Seconds
    if (ttl) {
      setResetTime(Date.now() + (parseInt(ttl) * 1000));
      setTimeLeft(parseInt(ttl));
    }
  };

  useEffect(() => {
    fetchStatus(); // Initial fetch
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const testSingleRequest = async () => {
    const loadingToast = toast.loading('Testing Request...');
    try {
      const res = await axios.get(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800/api/test');
      syncTimer(res.headers);
      toast.success(
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Allowed (200 OK)
        </span>,
        {
          id: loadingToast,
          style: { border: '1px solid #10b981', color: '#10b981', background: '#0f172a' }
        }
      );
    } catch (err) {
      if (err.response) {
        syncTimer(err.response.headers);
        if (err.response.status === 429) {
          const resetIn = err.response.headers['x-ratelimit-reset'] || '?';
          toast.error(
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">timer</span>
              Blocked! Reset in {resetIn}s
            </span>,
            {
              id: loadingToast,
              style: { border: '1px solid #ef4444', color: '#ef4444', background: '#0f172a' }
            }
          );
        }
      } else {
        toast.error(`Error: ${err.message}`, { id: loadingToast });
      }
    }
    // Refresh metrics immediately
    fetchStatus();
  };

  const launchAttack = async () => {
    setIsAttacking(true);
    const batchSize = 50;

    toast(
      <span className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">rocket_launch</span>
        Launching 50 Requests...
      </span>,
      {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      }
    );

    // We only need one response to get the headers
    let headersCaptured = false;

    const requests = Array.from({ length: batchSize }, () =>
      axios.get(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800/api/test')
        .then((res) => {
          if (!headersCaptured) {
            syncTimer(res.headers);
            headersCaptured = true;
          }
          return 'allowed';
        })
        .catch((err) => {
          if (!headersCaptured && err.response) {
            syncTimer(err.response.headers);
            headersCaptured = true;
          }
          return (err.response?.status === 429 ? 'blocked' : 'error');
        })
    );

    const results = await Promise.all(requests);
    const allowed = results.filter(r => r === 'allowed').length;
    const blocked = results.filter(r => r === 'blocked').length;

    toast.success(
      <span className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">fact_check</span>
        Attack Complete: {allowed} Allowed, {blocked} Blocked
      </span>,
      {
        duration: 5000,
        style: {
          border: '1px solid #10b981',
          padding: '16px',
          color: '#10b981',
          background: '#0f172a'
        },
      }
    );

    setTimeout(() => setIsAttacking(false), 2000); // Visual cooldown
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-display">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-surface-dark border-b border-[#344d66] px-6 py-4 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary">shield</span>
            </motion.div>
            <h1 className="text-xl font-bold">LimitGuard</h1>
          </div>

          <div className="flex gap-3 items-center">
            {/* --- TIMER BADGE --- */}
            <AnimatePresence>
              {timeLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dark border border-blue-500/30 text-blue-400 mr-2"
                >
                  <span className="material-symbols-outlined text-sm animate-pulse">timer</span>
                  <span className="font-mono font-bold text-sm">Resets: {timeLeft}s</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={testSingleRequest}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-surface-dark border border-[#344d66] hover:bg-[#344d66] transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-emerald-400">play_arrow</span>
              Test Request
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={launchAttack}
              disabled={isAttacking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${isAttacking
                ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                }`}
            >
              <span className={`material-symbols-outlined text-lg ${isAttacking ? 'animate-spin' : ''}`}>
                {isAttacking ? 'autorenew' : 'warning'}
              </span>
              {isAttacking ? 'Attacking...' : 'Simulate Attack'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <motion.main
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto p-6 space-y-6"
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={fadeIn} whileHover="hover" initial="rest" animate="rest" variants={cardHover} className="bg-surface-dark border border-[#344d66] rounded-xl p-5 hover:shadow-xl transition-shadow cursor-default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Total Requests</p>
              <span className="material-symbols-outlined text-text-secondary">bar_chart</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{metrics.total}</p>
              <span className="text-emerald-400 text-sm font-medium mb-1">Real-time</span>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} whileHover="hover" initial="rest" animate="rest" variants={cardHover} className="bg-surface-dark border border-[#344d66] rounded-xl p-5 hover:shadow-xl transition-shadow cursor-default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Pass Rate</p>
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{metrics.passRate}%</p>
              <span className="text-text-secondary text-sm mb-1">Atomic</span>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} whileHover="hover" initial="rest" animate="rest" variants={cardHover} className="bg-surface-dark border border-[#344d66] rounded-xl p-5 hover:shadow-xl transition-shadow cursor-default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Block Rate</p>
              <span className="material-symbols-outlined text-orange-400">block</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{metrics.blockRate}%</p>
              <span className="text-text-secondary text-sm mb-1">Throttled</span>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} whileHover="hover" initial="rest" animate="rest" variants={cardHover} className="bg-surface-dark border border-[#344d66] rounded-xl p-5 hover:shadow-xl transition-shadow cursor-default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-secondary text-sm font-medium">Redis Latency</p>
              <span className="material-symbols-outlined text-primary">bolt</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{metrics.latency}ms</p>
              <span className="text-text-secondary text-sm mb-1">RTT</span>
            </div>
          </motion.div>
        </div>

        {/* Dynamic & Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <motion.div variants={fadeIn} className="bg-surface-dark border border-[#344d66] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Traffic Volume</h2>
                <p className="text-text-secondary text-sm mt-1">Allowed vs Denied • Live Stream</p>
              </div>
              <div className="flex gap-2 bg-background-dark/50 p-1 rounded-lg">
                <span className="relative flex h-3 w-3 mr-1 self-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium self-center px-2">Live</span>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fa6238" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#fa6238" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#344d66" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#92adc9" style={{ fontSize: 12 }} />
                  <YAxis stroke="#92adc9" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#233648',
                      border: '1px solid #344d66',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="allowed" stroke="#137fec" fillOpacity={1} fill="url(#colorAllowed)" strokeWidth={2} />
                  <Area type="monotone" dataKey="denied" stroke="#fa6238" fillOpacity={1} fill="url(#colorDenied)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Geo Map */}
          <motion.div variants={fadeIn} className="bg-surface-dark border border-[#344d66] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Traffic Origins</h2>
                <p className="text-text-secondary text-sm mt-1">Real-time Geo-Distribution</p>
              </div>
              <span className="material-symbols-outlined text-emerald-400">public</span>
            </div>
            <GeoMap data={metrics.geo} />
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules Manager (Left 2/3) */}
          <motion.div variants={fadeIn} className="lg:col-span-2">
            <RulesManager rules={rules} onUpdate={fetchStatus} />
          </motion.div>

          {/* System Status & Alerts */}
          <motion.div variants={fadeIn} className="space-y-6">
            <div className="bg-surface-dark border border-[#344d66] rounded-xl p-5">
              <h3 className="font-bold mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#344d66]">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400 text-lg">dns</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Redis Cluster</p>
                      <span className={clsx("text-xs font-bold", metrics.redisStatus === 'Connected' ? "text-emerald-400" : "text-red-400")}>
                        {metrics.redisStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-400 text-lg">schedule</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">System Uptime</p>
                      <span className="text-blue-400 text-xs font-bold">{(metrics.uptime / 60).toFixed(0)}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Alerts - Only show if there IS an alert */}
            <AnimatePresence>
              {isAttacking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-surface-dark border border-[#344d66] rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Live Alerts</h3>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 rounded-lg bg-background-dark/50 border-l-2 border-orange-500">
                      <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
                      <div>
                        <p className="font-medium text-sm">Traffic Spike Detected</p>
                        <p className="text-text-secondary text-xs mt-1">High request volume.</p>
                        <p className="text-text-secondary/60 text-[10px] mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
