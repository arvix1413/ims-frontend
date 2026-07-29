'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';
import CryptoJS from 'crypto-js';
import Image from 'next/image';
import { useNotification } from '@/lib/notificationManager';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const notification = useNotification();

  const bgImages = ['/assets/bg/1.png', '/assets/bg/2.png', '/assets/bg/3.png', '/assets/bg/4.png'];

  // 检查是否已经登录
  useEffect(() => {
    if (authManager.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  // 自动循环切换背景图片
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 4000); // 每4秒切换一次

    return () => clearInterval(interval);
  }, [bgImages.length]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 4500);
    return () => window.clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields = [!name.trim() ? 'Account' : '', !password ? 'Password' : ''].filter(Boolean);
    if (missingFields.length) {
      const validationMessage = `Please complete: ${missingFields.join(', ')}`;
      setError(validationMessage);
      notification.custom({
        key: 'global-form-validation',
        type: 'warning',
        message: 'Please complete all required fields',
        description: validationMessage,
        duration: 4.5,
        placement: 'topRight',
      });
      document.getElementById(!name.trim() ? 'name' : 'password')?.focus();
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 使用MD5加密密码
      // const encryptedPassword = CryptoJS.MD5(password).toString();
      
      const success = await authManager.login(name, password,"");
      
      if (success) {
        router.push('/');
      } else {
        setError('登录失败，请检查用户名和密码');
      }
    } catch (error) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左侧：Logo + 登录表单 */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center px-8 py-12 lg:py-0 relative">
        {/* Logo区域 */}
        <div className="mb-12">
          <Image
            src="/assets/sl.png"
            alt="Slady Logo"
            width={180}
            height={72}
            className="mx-auto"
            priority
          />
        </div>

        {/* 登录表单 */}
        <div className="w-full max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Account
              </label>
              <input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Login...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* 右侧：背景图片轮播 */}
      <div className="w-full lg:w-1/2 h-128 lg:h-auto relative overflow-hidden">
        {/* 背景图片容器 */}
        <div className="relative w-full h-full">
          {bgImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentBgIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image}
                alt={`Background ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
              {/* 渐变遮罩 */}
              <div className="absolute inset-0"></div>
            </div>
          ))}
        </div>

        {/* 轮播指示器 */}
        {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {bgImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentBgIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => setCurrentBgIndex(index)}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
}
