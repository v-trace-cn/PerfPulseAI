"use client";

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { directUserApi } from '@/lib/direct-api';

export default function ApiTestPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loginResponse, setLoginResponse] = useState<any>(null);
  const [registerResponse, setRegisterResponse] = useState<any>(null);
  const [userResponse, setUserResponse] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading('health');
    setError(null);
    try {
      const response = await authApi.checkHealth();
      setHealthStatus(response);
    } catch (err: any) {
      setError(`健康检查失败: ${err.message || String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  const testLogin = async () => {
    setLoading('login');
    setError(null);
    try {
      const response = await authApi.login('test@example.com', 'password123');
      setLoginResponse(response);
      
      if (response.success && response.data && response.data.userId) {
        // Try to get user profile
        const userData = await directUserApi.getProfile(response.data.userId);
        setUserResponse(userData);
      }
    } catch (err: any) {
      setError(`登录测试失败: ${err.message || String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  const testRegister = async () => {
    setLoading('register');
    setError(null);
    try {
      const response = await authApi.register(
        `test${Date.now()}@example.com`, 
        'password123', 
        `Test User ${Date.now()}`
      );
      setRegisterResponse(response);
      
      if (response.success && response.data && response.data.userId) {
        // Try to get user profile
        const userData = await directUserApi.getProfile(response.data.userId);
        setUserResponse(userData);
      }
    } catch (err: any) {
      setError(`注册测试失败: ${err.message || String(err)}`);
    }
    finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API 连接测试</h1>
      
      <div className="grid gap-6">
        {/* 健康检查 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">健康检查</h2>
          <button 
            onClick={checkHealth} 
            disabled={loading === 'health'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading === 'health' ? '检查中...' : '检查健康状态'}
          </button>
          
          {healthStatus && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(healthStatus, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* 登录测试 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">登录测试</h2>
          <button 
            onClick={testLogin} 
            disabled={loading === 'login'}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading === 'login' ? '登录中...' : '测试登录'}
          </button>
          
          {loginResponse && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(loginResponse, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* 注册测试 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">注册测试</h2>
          <button 
            onClick={testRegister} 
            disabled={loading === 'register'}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading === 'register' ? '注册中...' : '测试注册'}
          </button>
          
          {registerResponse && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(registerResponse, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* 用户数据 */}
        {userResponse && (
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">用户数据</h2>
            <div className="p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(userResponse, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {error && (
          <div className="border border-red-300 rounded-lg p-4 bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-600">错误</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {/* 登录/注册表单示例 */}
        <div className="border rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">登录/注册表单示例</h2>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p className="text-sm text-gray-700">
              当API返回错误时，错误消息将显示在表单下方，而不是只显示状态码。
              例如：<span className="text-red-500">邮箱还没有注册</span> 而不是 <span className="text-red-500">API error: 401</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
