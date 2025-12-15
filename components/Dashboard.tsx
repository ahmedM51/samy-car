import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Coins, FileCheck, Car, Wallet, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalOutstanding: 0,
    showroomCount: 0,
    totalInvestorsBalance: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  // SQL code to display - Updated to include CASCADE for robust drops
  const sqlCode = `-- انسخ هذا الكود وضعه في Supabase SQL Editor
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS investors CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS showroom CASCADE;
DROP TABLE IF EXISTS title_transfers CASCADE;

CREATE TABLE inventory (id TEXT PRIMARY KEY, type TEXT, model TEXT, plate_number TEXT, vin TEXT, price NUMERIC, status TEXT);
CREATE TABLE investors (id TEXT PRIMARY KEY, name TEXT, id_number TEXT, id_expiry TEXT, phone TEXT, email TEXT, balance NUMERIC);
CREATE TABLE buyers (id TEXT PRIMARY KEY, name TEXT, id_number TEXT, id_expiry TEXT, phone TEXT, job TEXT, address TEXT, email TEXT);
CREATE TABLE contracts (id TEXT PRIMARY KEY, manual_id TEXT, type TEXT, created_at TIMESTAMPTZ, buyer_id TEXT, guarantor_id TEXT, investor_id TEXT, inventory_ids TEXT[], total_item_value NUMERIC, service_fee NUMERIC, total_amount NUMERIC, status TEXT, notes TEXT);
CREATE TABLE installments (id TEXT PRIMARY KEY, contract_id TEXT REFERENCES contracts(id), due_date TIMESTAMPTZ, amount NUMERIC, status TEXT, paid_date TIMESTAMPTZ);
CREATE TABLE showroom (id TEXT PRIMARY KEY, owner_name TEXT, owner_phone TEXT, type TEXT, plate_number TEXT, previous_price NUMERIC, selling_price NUMERIC, condition TEXT, status TEXT, entry_date TIMESTAMPTZ);
CREATE TABLE title_transfers (id TEXT PRIMARY KEY, manual_id TEXT, created_at TIMESTAMPTZ, seller_name TEXT, seller_id_number TEXT, buyer_name TEXT, buyer_id_number TEXT, vehicle_type TEXT, vehicle_model TEXT, plate_number TEXT, vin TEXT, price NUMERIC, service_fees NUMERIC);

ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE investors DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE showroom DISABLE ROW LEVEL SECURITY;
ALTER TABLE title_transfers DISABLE ROW LEVEL SECURITY;`;

  useEffect(() => {
    const checkAndFetch = async () => {
      try {
        // فحص سريع لوجود الجدول
        const { error: checkError } = await supabase.from('inventory').select('id').limit(1);
        if (checkError) {
            console.error("Database Check Error:", checkError);
            // 42P01 means table undefined. Other errors might mean connection issues.
            setDbError(true);
            setLoading(false);
            return;
        }

        const [contracts, installments, showroom, investors] = await Promise.all([
          db.getContracts(),
          db.getAllInstallments(),
          db.getShowroomItems(),
          db.getInvestors()
        ]);

        const activeContracts = contracts.length;
        const outstanding = installments
          .filter(i => i.status === 'مطلوب دفعه' || i.status === 'متأخر')
          .reduce((acc, curr) => acc + curr.amount, 0);
        
        const showroomCount = showroom.length;
        const totalInvestorsBalance = investors.reduce((acc, curr) => acc + curr.balance, 0);

        setStats({
          activeContracts,
          totalOutstanding: outstanding,
          showroomCount,
          totalInvestorsBalance
        });

        const paid = installments.filter(i => i.status === 'تم السداد').reduce((acc, c) => acc + c.amount, 0);
        const unpaid = outstanding;

        setChartData([
          { name: 'تم التحصيل', value: paid },
          { name: 'باقي في السوق', value: unpaid },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setDbError(true); // Assuming error means DB issues for now
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">جاري الاتصال بقاعدة البيانات...</p>
      </div>
  );

  if (dbError) {
    return (
      <div className="bg-red-50 border-r-4 border-red-500 p-8 m-4 rounded shadow-lg">
        <div className="flex items-start flex-col md:flex-row">
          <AlertTriangle className="h-12 w-12 text-red-500 ml-4 mb-4 md:mb-0 flex-shrink-0" />
          <div className="flex-1 w-full">
            <h3 className="text-2xl font-bold text-red-800 mb-2">مطلوب إعداد قاعدة البيانات</h3>
            <p className="text-red-700 mb-6 text-lg">
              التطبيق غير قادر على قراءة البيانات. هذا يحدث عادة لأن الجداول لم يتم إنشاؤها بعد في Supabase.
            </p>
            
            <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm w-full">
              <h4 className="font-bold text-lg mb-4 border-b pb-2 flex items-center">
                <span className="bg-red-100 text-red-800 w-8 h-8 rounded-full flex items-center justify-center ml-2 text-sm">1</span>
                 انسخ كود SQL التالي:
              </h4>
              
              <div className="relative mb-6">
                <textarea 
                  readOnly 
                  className="w-full h-48 p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary dir-ltr text-left"
                  value={sqlCode}
                  dir="ltr"
                />
                <button 
                    onClick={handleCopySQL}
                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors"
                    title="نسخ الكود"
                >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <h4 className="font-bold text-lg mb-4 border-b pb-2 flex items-center">
                <span className="bg-red-100 text-red-800 w-8 h-8 rounded-full flex items-center justify-center ml-2 text-sm">2</span>
                 نفذ الكود في Supabase:
              </h4>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                 <a 
                   href="https://supabase.com/dashboard/project/_/sql/new" 
                   target="_blank" 
                   rel="noreferrer" 
                   className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md"
                 >
                   <ExternalLink className="w-5 h-5 ml-2" />
                   الذهاب إلى Supabase SQL Editor
                 </a>
                 <span className="text-gray-500 text-sm">
                    (اضغط <strong>New Query</strong> ثم الصق الكود واضغط <strong>Run</strong>)
                 </span>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                  <p className="text-gray-600 mb-4">بعد تنفيذ الخطوات، اضغط هنا لإعادة المحاولة</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-8 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
                  >
                    تحديث الصفحة
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">الرئيسية</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="لينا فلوس برا" 
          value={`${stats.totalOutstanding.toLocaleString()} ج.م`} 
          icon={Coins} 
          color="bg-red-500" 
        />
        <StatCard 
          title="عقود مفتوحة" 
          value={stats.activeContracts} 
          icon={FileCheck} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="عربيات في المعرض" 
          value={stats.showroomCount} 
          icon={Car} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="محفظة الممولين" 
          value={`${stats.totalInvestorsBalance.toLocaleString()} ج.م`} 
          icon={Wallet} 
          color="bg-green-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">موقف التحصيل</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">نظرة عامة</h3>
          <p className="text-gray-600">
            أهلاً بيك يا ريس. من هنا تقدر تتابع حركة البيع والشراء، تحصيل الأقساط، وموقف العربيات في المعرض.
          </p>
          <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
            <strong className="block mb-2">تنبيهات سريعة:</strong>
            <ul className="list-disc list-inside space-y-1">
              <li>فيه {stats.activeContracts} عميل بيقسطوا حالياً.</li>
              <li>راجع حسابات الممولين عشان لو حد ليه أرباح.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;