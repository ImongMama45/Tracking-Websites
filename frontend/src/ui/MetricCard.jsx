import { motion } from "framer-motion";

export default function MetricCard({ label, value, change, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && <Icon className="text-brand" size={20} />}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold">{value}</p>
        {change !== undefined && <span className="rounded-full bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">{change}%</span>}
      </div>
    </motion.div>
  );
}
