import React, { useState, useEffect } from 'react';
import { Settings, LogOut, CheckCircle, Loader2, Database, ExternalLink, Info } from 'lucide-react';
import { WEBHOOKS } from '../constants';
import { UserSession, UserData } from '../types';

interface ConfigFormProps {
  session: UserSession;
  onLogout: () => void;
  initialData: UserData | null;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ session, onLogout, initialData }) => {
  const [productId, setProductId] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (initialData?.productId) setProductId(initialData.productId);
    if (initialData?.token) setToken(initialData.token);
  }, [initialData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(WEBHOOKS.CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.email,
          productId,
          token
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message || 'Configurações atualizadas com sucesso.', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Falha crítica ao salvar.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Falha no protocolo de sincronização. Verifique a conexão.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Usuário</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{session.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
          title="Encerrar Sessão"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Webhook Info Section */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-wider">
            <Info size={14} className="text-cyan-500" />
            Integração de Checkout
          </div>
          <a 
            href="https://d-enterprise.online/integracoes" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors uppercase font-mono"
          >
            Como integrar <ExternalLink size={10} />
          </a>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Utilize este webhook no seu checkout para marcar vendas automaticamente (apenas eventos de pagamento aprovado):
        </p>
        <div className="bg-black/50 p-2 rounded border border-zinc-800 font-mono text-[9px] text-cyan-400 break-all select-all cursor-pointer hover:border-cyan-500/50 transition-colors">
          https://n8n-n8n.68tvlf.easypanel.host/webhook/marcador-vturb
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : null}
          {message.text}
        </div>
      )}

      {initialData?.productId && (
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono bg-cyan-400/5 px-3 py-2 rounded-md border border-cyan-400/10">
          <Database size={14} />
          BASE DE DADOS VINCULADA: DADOS SINCRONIZADOS
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">ID do Produto</label>
            <a 
              href="https://d-enterprise.online/id-do-produto" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors uppercase font-mono"
            >
              Como pegar <ExternalLink size={10} />
            </a>
          </div>
          <input
            type="text"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition-all input-focus"
            placeholder="019b11aa-5eb4-7066-a35a-7c20b57606cb"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">Token Vturb</label>
            <a 
              href="https://d-enterprise.online/token-vturb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors uppercase font-mono"
            >
              Como pegar <ExternalLink size={10} />
            </a>
          </div>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition-all input-focus font-mono text-sm"
            placeholder="480e1b11-0d6d-4798-a79c-73d1ed01118c"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-500 text-black font-bold py-4 rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'SINCRONIZAR USUÁRIO'
          )}
        </button>
      </form>
    </div>
  );
};

export default ConfigForm;