import React, { useState, useEffect } from 'react';
// เราจะใช้ CDN เหมือนเดิมเพื่อให้ง่ายต่อการทดสอบ
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

// !================================================================!
// !  สำคัญ: เราจะใช้ Environment Variables จาก Vercel
// !  โค้ดนี้จะดึงค่าที่ Vercel เก็บไว้ให้โดยอัตโนมัติ
// !================================================================!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// !================================================================!

// ถ้าค่าจาก Vercel ไม่มี (เช่นตอนรันทดสอบ) ให้ใช้ค่าสำรอง
// **แต่สำหรับการใช้งานจริง** Vercel จะใส่ค่าจริงให้เอง
const supabase = createClient(
  supabaseUrl || 'https://cfgqspgxxxvrbaeuofoq.supabase.co', 
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ3FzcGd4eHh2cmJhZXVvZm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTQxODUsImV4cCI6MjA3NzgzMDE4NX0.gkcl8rMEMPE61drdDPfx2M8Z8HyJ_IF3ju5HPKDkutA'
);

// --- Component: หน้า Login / Register ---
function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่า Supabase พร้อมใช้งานหรือไม่
    if (!supabaseUrl || !supabaseKey) {
        setError("แอปยังไม่เชื่อมต่อกับฐานข้อมูล (Supabase)");
        console.error("Supabase URL or Key is missing. Check Vercel Environment Variables.");
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      let authResponse;
      if (isLogin) {
        // --- Login ---
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      } else {
        // --- Register ---
        authResponse = await supabase.auth.signUp({ email, password });
        if (authResponse.error) throw authResponse.error;
        
        const { data, error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: authResponse.data.user.id, 
            full_name: 'ผู้ใช้ใหม่ (รอ Admin อัปเดต)',
            dob: '1900-01-01'
          });
        
        if (profileError) throw profileError;
      }

      if (authResponse.error) throw authResponse.error;

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.g.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'กำลังโหลด...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
        </button>
      </form>
      {error && <p className="text-sm text-center text-red-500">{error}</p>}
      <p className="text-sm text-center text-gray-600">
        {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="ml-1 font-medium text-blue-600 hover:underline"
        >
          {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
      </p>
    </div>
  );
}

// --- Component: บัตรแพ้ยา ---
function AllergyCard({ profile, allergies, onLogout }) {
  if (!profile) {
    return <div className="text-center text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }
  
  // จัดรูปแบบวันที่ (เช่น 1 ม.ค. 2540)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-lg p-6 mx-auto bg-white rounded-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-red-600">บัตรแพ้ยา (Digital)</h1>
        <button
          onClick={onLogout}
          className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* --- ข้อมูลผู้ป่วย --- */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800">{profile.full_name}</h3>
        <p className="text-gray-600">
          <span className="font-medium">วันเกิด:</span> {formatDate(profile.dob)}
        </p>
      </div>

      {/* --- รายการยาที่แพ้ --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">รายการยาที่แพ้:</h3>
        {allergies.length > 0 ? (
          allergies.map((allergy) => (
            <div key={allergy.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
              <p className="text-xl font-bold text-red-700">{allergy.allergic_drug}</p>
              <p className="mt-1 text-gray-700">
                <span className="font-medium">อาการแพ้:</span> {allergy.reaction_symptom}
              </p>
              <hr className="my-2" />
              <p className="text-sm text-gray-500">
                <span className="font-medium">ผู้รายงาน:</span> {allergy.pharmacist_name}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">วันที่รายงาน:</span> {formatDate(allergy.report_date)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
            ไม่พบข้อมูลการแพ้ยา
            <br />
            (กรุณารอผู้ดูแลระบบเพิ่มข้อมูลหลังบ้าน)
          </div>
        )}
      </div>
    </div>
  );
}

// --- Component: App หลัก ---
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. ตรวจสอบ Session การ Login
  useEffect(() => {
    // ถ้าไม่มีการตั้งค่า Supabase Key ก็ไม่ต้องทำอะไรต่อ
    if (!supabaseKey) {
        setError("แอปยังไม่ได้ตั้งค่า (Missing Supabase Keys)");
        setLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 2. ถ้า Login แล้ว ให้ไปดึงข้อมูล
  useEffect(() => {
    if (session && supabaseKey) {
      fetchData();
    } else {
      // ถ้า Logout ให้เคลียร์ข้อมูล
      setProfile(null);
      setAllergies([]);
    }
  }, [session]);

  const fetchData = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    try {
      // ดึงข้อมูลโปรไฟล์
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      // ดึงข้อมูลการแพ้ยา
      const { data: allergyData, error: allergyError } = await supabase
        .from('allergy_cards')
        .select('*')
        .eq('user_id', session.user.id);

      if (allergyError) throw allergyError;
      setAllergies(allergyData || []);

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {loading ? (
        <div className="text-xl font-medium text-gray-600">กำลังโหลด...</div>
      ) : error ? (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          <strong>เกิดข้อผิดพลาด:</strong> {error}
        </div>
      ) : !session ? (
        <AuthForm />
      ) : (
        <AllergyCard 
          profile={profile} 
          allergies={allergies} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
