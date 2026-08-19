'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconStethoscope, IconNurse, IconClipboard, IconFlask, IconShield, IconAlertCircle, IconLock, IconUser, IconDollarSign } from '@/client/components/icons';
import '@/client/styles/login.css';

const DEMO_ACCOUNTS = [
  { role: 'Doctor', email: 'doctor@h1ms.com', icon: IconStethoscope },
  { role: 'Nurse', email: 'nurse@h1ms.com', icon: IconNurse },
  { role: 'Receptionist', email: 'receptionist@h1ms.com', icon: IconClipboard },
  { role: 'Pharmacist', email: 'pharmacist@h1ms.com', icon: IconFlask },
  { role: 'Accountant', email: 'accountant@h1ms.com', icon: IconDollarSign },
  { role: 'Admin', email: 'admin@h1ms.com', icon: IconShield },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setSelectedDemo(demoEmail);
    setEmail(demoEmail);
    setPassword('demo123');
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: demoEmail,
        password: 'demo123',
        redirect: false,
      });

      if (result?.error) {
        setError('Demo login failed. Please run the seed script first.');
        setLoading(false);
        setSelectedDemo(null);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
      setSelectedDemo(null);
    }
  };

  return (
    <div className="login-page">
      {/* Subtle grid background */}
      <div className="login-bg">
        <div className="login-bg__grid" />
      </div>

      {/* Header */}
      <header className="login-header-bar">
        <div className="login-header-bar__logo">H1MS</div>
        <nav className="login-header-bar__nav">
          <a href="#" className="login-header-bar__link">Contact Support</a>
          <a href="#" className="login-header-bar__link">Help</a>
        </nav>
      </header>

      <div className="login-container">
        {/* Login Card */}
        <div className="login-card">
          {/* Branding */}
          <div className="login-brand">
            <h1 className="login-brand__title">
              H<span className="text-gradient">1</span>MS
            </h1>
            <p className="login-brand__subtitle">
              Hospital Management System
            </p>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon"><IconUser size={16} /></span>
                <input
                  id="email"
                  type="email"
                  className="input-field input-field--with-icon"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon"><IconLock size={16} /></span>
                <input
                  id="password"
                  type="password"
                  className="input-field input-field--with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="login-error">
                <IconAlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="login-demo">
          <div className="login-demo__divider">
            <span>Quick Demo Access</span>
          </div>
          <div className="login-demo__grid">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                className={`login-demo__btn ${selectedDemo === demo.email ? 'login-demo__btn--active' : ''}`}
                onClick={() => handleDemoLogin(demo.email)}
                disabled={loading}
                id={`demo-${demo.role.toLowerCase()}`}
              >
                <span className="login-demo__icon"><demo.icon size={20} /></span>
                <span className="login-demo__role">{demo.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
