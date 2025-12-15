import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : error.message);
      setLoading(false);
    } else {
      // Auth state listener in context will handle the redirect mostly, 
      // but strictly navigating ensures smoothness
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h1>
          <p className="text-slate-300">مرحباً بك في نظام إدارة المعرض</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left dir-ltr"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left dir-ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 text-lg font-bold shadow-lg shadow-emerald-200" 
            disabled={loading}
          >
            {loading ? 'جاري الدخول...' : 'دخول للنظام'}
            {!loading && <LogIn className="mr-2 h-5 w-5" />}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;