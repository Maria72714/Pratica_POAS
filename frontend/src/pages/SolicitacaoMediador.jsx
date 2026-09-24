import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitarAcessoMediador } from '../services/api';

const initialForm = {
  nome: '',
  email: '',
  usuario: '',
  matricula: '',
  senha: '',
  confirmarSenha: '',
  tipoMediacao: 'acompanhamento',
  descricao: '',
};

export default function SolicitacaoMediador() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (submitted) setSubmitted(false);
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await solicitarAcessoMediador({
        nome: form.nome,
        email: form.email,
        usuario: form.usuario,
        matricula: form.matricula || form.usuario,
        senha: form.senha,
        confirmarSenha: form.confirmarSenha,
        tipoMediacao: form.tipoMediacao,
        descricao: form.descricao,
      });

      setSubmitted(true);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-10 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.45),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.28),transparent_24%)]" />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-5 flex justify-center">
          <img
            src="/images/logo_branca_pratica_vetorizada.png"
            alt="pratiCA"
            className="h-16 w-auto drop-shadow-lg"
          />
        </div>

        <div className="rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-white/40">
          <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />

        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Solicitar Acesso como Mediador</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500">
              Preencha o formulário abaixo para se candidatar a mediador do pratiCA.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {submitted && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Solicitação enviada com sucesso. Agora você pode acessar o sistema com suas credenciais de mediador.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome Completo" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" required />
              <Field label="E-mail" name="email" value={form.email} onChange={handleChange} placeholder="seuemail@escolar.ifrn.edu.br" type="email" required />
              <Field label="Nome de Usuário" name="usuario" value={form.usuario} onChange={handleChange} placeholder="Seu nome de usuário" required />
              <Field label="Matrícula (opcional)" name="matricula" value={form.matricula} onChange={handleChange} placeholder="Seu número de matrícula (se tiver)" />
              <Field label="Senha" name="senha" value={form.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" type="password" required />
              <Field label="Confirmar Senha" name="confirmarSenha" value={form.confirmarSenha} onChange={handleChange} placeholder="Repita sua senha" type="password" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de Mediação</label>
              <select
                name="tipoMediacao"
                value={form.tipoMediacao}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="acompanhamento">Acompanhamento</option>
                <option value="libras">Libras</option>
                <option value="braile">Braile</option>
                <option value="mobilidade">Mobilidade</option>
                <option value="transtornos_especificos">Transtornos específicos</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Descrição do Apoio (opcional)</label>
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                rows={5}
                placeholder="Descreva brevemente sua experiência ou o tipo de apoio que você pode oferecer..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 resize-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />
    </div>
  );
}