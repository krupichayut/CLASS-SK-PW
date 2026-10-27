"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        await signUp(email, password);
        setSuccessMsg("สร้างบัญชีครูสำเร็จ! กำลังเข้าสู่ระบบ...");
      } else {
        await signIn(email, password);
        setSuccessMsg("เข้าสู่ระบบสำเร็จ!");
      }
      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (err.code === "auth/user-not-found") {
        setError("ไม่พบอีเมลนี้ในระบบ คุณครูสามารถกด 'สมัครบัญชีใหม่' ด้านล่างได้ครับ");
      } else if (err.code === "auth/email-already-in-use") {
        setError("อีเมลนี้ถูกใช้งานแล้ว กรุณากดเข้าสู่ระบบ");
      } else if (err.code === "auth/weak-password") {
        setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("ยังไม่ได้เปิดใช้งาน Email/Password ใน Firebase Console (ไปที่ Build > Authentication > Add new provider > Email/Password)");
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMsg("เข้าสู่ระบบด้วย Google สำเร็จ!");
      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // User closed popup
      } else if (err.code === "auth/operation-not-allowed") {
        setError("ยังไม่ได้เปิดใช้งาน Google ใน Firebase Console (ไปที่ Authentication > Sign-in method > Google แล้วกด Save)");
      } else {
        setError(err.message || "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#6b7c91] via-[#546477] to-[#3f4d5e] p-4 sm:p-6 antialiased text-slate-800">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-400/25 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-teal-400/20 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_25px_60px_rgba(0,0,0,0.2)] p-8 sm:p-10 transition-all">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-3.5">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isRegisterMode ? "ลงทะเบียนบัญชีครู" : "เข้าสู่ระบบ Classroom OS"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            ระบบจัดการชั้นเรียน บันทึกเวลาเรียน และรายงาน ปพ.5
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* One-Click Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 mb-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>เข้าสู่ระบบด้วยบัญชี Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หรือใช้อีเมล</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              อีเมล
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.ac.th"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs sm:text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs sm:text-sm outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? "กำลังดำเนินการ..." : isRegisterMode ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ"}</span>
            <ArrowRight className="w-4 h-4 text-indigo-300" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isRegisterMode 
              ? "มีบัญชีอยู่แล้ว? คลิกเพื่อเข้าสู่ระบบ" 
              : "ยังไม่มีบัญชี? คลิกเพื่อสร้างบัญชีครูใหม่"}
          </button>
        </div>
      </div>
    </div>
  );
}
