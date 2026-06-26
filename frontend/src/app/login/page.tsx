'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, setLoading } from '@/store/slices/authSlice';
import { useLoginMutation, useRegisterMutation, useGetMeQuery } from '@/store/services/authApi';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Mail, Lock, User, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [triggerLogin, { isLoading: isLoginLoading }] = useLoginMutation();
  const [triggerRegister, { isLoading: isRegisterLoading }] = useRegisterMutation();
  
  // Query to auto-retrieve session from cookie if it exists
  const { data: meData, isFetching: isMeFetching } = useGetMeQuery(undefined, {
    skip: isAuthenticated, // Skip if already loaded in memory
  });

  // 1. Auto-login on mount if cookie exists
  useEffect(() => {
    if (meData?.success && meData.user) {
      dispatch(setCredentials(meData.user));
    } else if (!isMeFetching) {
      dispatch(setLoading(false));
    }
  }, [meData, isMeFetching, dispatch]);

  // 2. Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Common validations
    if (!email.trim() || !password) {
      setErrorMessage('Please enter all required fields.');
      return;
    }

    if (isLoginView) {
      // 3. Login Flow
      try {
        const result = await triggerLogin({ email: email.trim(), password }).unwrap();
        dispatch(setCredentials(result.user));
      } catch (err: any) {
        console.error('Login error:', err);
        setErrorMessage(err.data?.message || 'Invalid email or password.');
      }
    } else {
      // 4. Register Flow (Student Only)
      if (!name.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      // Password strength check (min 8 chars, 1 letter, 1 number)
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        setErrorMessage('Password must be at least 8 characters long and contain at least one letter and one number.');
        return;
      }

      try {
        await triggerRegister({
          name: name.trim(),
          email: email.trim(),
          password,
        }).unwrap();
        
        setSuccessMessage('Registration successful! Please sign in with your credentials.');
        setIsLoginView(true);
        setName('');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        console.error('Registration error:', err);
        setErrorMessage(err.data?.message || 'Failed to register. Please check your credentials.');
      }
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const isLoading = isLoginLoading || isRegisterLoading || isMeFetching || (loading && isAuthenticated);

  if (isLoading && (isMeFetching || (loading && isAuthenticated))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-amber-500" size={40} />
          <p className="text-slate-500 font-medium text-sm">Verifying active session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-amber-500/10 via-slate-50 to-rose-500/10 flex items-center justify-center p-4">
      {/* Visual background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 p-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/15 mb-3">
            <UtensilsCrossed size={24} />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
            {isLoginView ? 'Welcome Back!' : 'Create Student Account'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoginView 
              ? 'Sign in to order food from the campus canteen' 
              : 'Register with college email to access the food portal'}
          </p>
        </div>

        {/* Error Notification banner */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* Success Notification banner */}
        {successMessage && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Only on Register) */}
          {!isLoginView && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Saurabh Khanka"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">College Email ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Confirm Password Field (Only on Register) */}
          {!isLoginView && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoginLoading || isRegisterLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 active:scale-[0.99] transition-all"
          >
            {isLoginLoading || isRegisterLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing processing...</span>
              </>
            ) : (
              <>
                <span>{isLoginView ? 'Sign In' : 'Register'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

        {/* View Toggle */}
        <div className="mt-6 text-center border-t border-slate-100 pt-6">
          <button
            onClick={toggleView}
            className="text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
          >
            {isLoginView 
              ? "Don't have an account? Register as Student" 
              : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Note on RBAC Role separation */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">
          <ShieldCheck size={12} />
          <span>Role-Based Access Controlled</span>
        </div>

      </div>
    </main>
  );
}
