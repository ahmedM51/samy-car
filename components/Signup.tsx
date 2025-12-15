import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSuccessMsg('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-slate-400">سجل بياناتك للبدء في استخدام النظام</p>
        </div>
        
        <form onSubmit={handleSignup} className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span className="text-sm font-bold">{successMsg}</span>
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
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left dir-ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">يجب أن تكون كلمة المرور 6 أحرف على الأقل.</p>
          </div>

          {!successMsg ? (
              <Button 
                type="submit" 
                className="w-full py-3 text-lg font-bold" 
                disabled={loading}
              >
                {loading ? 'جاري التسجيل...' : 'تسجيل الحساب'}
                {!loading && <UserPlus className="mr-2 h-5 w-5" />}
              </Button>
          ) : (
              <Link to="/login">
                  <Button className="w-full py-3 text-lg font-bold bg-slate-800 hover:bg-slate-900">
                      الذهاب لصفحة الدخول
                  </Button>
              </Link>
          )}

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;