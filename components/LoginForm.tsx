import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { WEBHOOKS } from '../constants';
import { ApiResponse, UserData } from '../types';

interface LoginFormProps {
  onLoginSuccess: (email: string, data?: UserData) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(WEBHOOKS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let responseText = await response.text();
      let data: ApiResponse;

      try {
        responseText = responseText.trim();
        if (responseText.startsWith('"') && responseText.endsWith('"')) {
          responseText = responseText.slice(1, -1).replace(/\\"/g, '"');
        }
        responseText = responseText.replace(/\{\{\s*\$json\.id\s*\}\}/g, '0');
        responseText = responseText.replace(/\{\{[^}]+\}\}/g, '"unknown"');
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (responseText.includes('"success"') && responseText.includes('true')) {
          data = { success: true, message: 'Autenticação Concluída' };
        } else {
          data = { success: false, message: 'Credenciais inválidas' };
        }
      }

      const isSuccess = data.success === true || data.success === 'true';

      if (isSuccess) {
        onLoginSuccess(email, {
          productId: data.productId,
          token: data.token
        });
      } else {
        setError(data.message || 'Falha na autenticação. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Conexão recusada. Verifique sua rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-zinc-100">Identidade de Acesso</h2>
        <p className="text-sm text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
          Entre com seu e-mail e senha para começar.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm animate-pulse text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 ml-1">E-mail de Acesso</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition-all input-focus"
            placeholder="identidade@d-enterprise.online"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 ml-1">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition-all input-focus pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-4 flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'FAZER LOGIN'
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;