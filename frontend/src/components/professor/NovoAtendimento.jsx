// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   buscarPerfilProfessor,
//   cadastrarAtendimentoProfessor,
// } from '../../services/professor/agendamento';

// // Data local de hoje (evita o bug do dia seguinte por causa do UTC)
// function hojeISO() {
//   const d = new Date();
//   d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
//   return d.toISOString().split('T')[0];
// }

// // Valores EXATOS dos enums do backend (models/enums/__init__.py)
// const TIPOS = ['TAL', 'TAI'];
// const MODALIDADES = ['Presencial', 'Remoto'];

// const inputClass =
//   'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white ' +
//   'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';

// export default function NovoAtendimento() {
//   const navigate = useNavigate();

//   const usuario = JSON.parse(
//     localStorage.getItem('usuario') || localStorage.getItem('suap_user') || 'null'
//   );

//   const [disciplinas, setDisciplinas] = useState([]);
//   const [enviando, setEnviando] = useState(false);
//   const [erro, setErro] = useState('');
//   const [form, setForm] = useState({
//     assunto: '',
//     disciplina: '',
//     data_atendimento: '',
//     tipo_atendimento: 'TAL',
//     modalidade: 'Presencial',
//   });

//   useEffect(() => {
//     if (!usuario?.matricula) return;
//     buscarPerfilProfessor(usuario.matricula)
//       .then((perfil) => setDisciplinas(perfil.disciplinas ?? []))
//       .catch(() => setDisciplinas([]));
//   }, [usuario?.matricula]);

//   const atualizar = (campo) => (e) =>
//     setForm((f) => ({ ...f, [campo]: e.target.value }));

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setErro('');

//     if (!usuario?.matricula) {
//       setErro('Matrícula do professor não encontrada.');
//       return;
//     }

//     setEnviando(true);
//     try {
//       await cadastrarAtendimentoProfessor({
//         matricula_professor: usuario.matricula,
//         ...form,
//         assunto: form.assunto.trim(),
//       });
//       navigate('/professor/atendimentos');
//     } catch (err) {
//       setErro(err.message);
//     } finally {
//       setEnviando(false);
//     }
//   }

//   // Botões estilo "segmented" para tipo e modalidade
//   const Opcoes = ({ campo, valores }) => (
//     <div className="flex gap-3">
//       {valores.map((v) => (
//         <button
//           key={v}
//           type="button"
//           onClick={() => setForm((f) => ({ ...f, [campo]: v }))}
//           className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
//             form[campo] === v
//               ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
//               : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
//           }`}
//         >
//           {v}
//         </button>
//       ))}
//     </div>
//   );

//   const formularioValido =
//     form.assunto.trim() && form.disciplina && form.data_atendimento;

//   return (
//     <div className="flex-1 bg-gray-50 min-h-screen p-4 sm:p-8">
//       <div className="max-w-3xl mx-auto space-y-6">

//         {/* Banner */}
//         <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 rounded-xl shadow-sm">
//           <h1 className="text-xl sm:text-2xl font-bold mb-1">Novo Atendimento</h1>
//           <p className="text-emerald-100 text-sm">
//             Cadastre um atendimento do Centro de Aprendizagem.
//           </p>
//         </div>

//         {/* Formulário */}
//         <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
//           <form className="space-y-6" onSubmit={handleSubmit}>

//             {/* Assunto */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Assunto <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 maxLength={250}
//                 value={form.assunto}
//                 onChange={atualizar('assunto')}
//                 placeholder="Ex.: Revisão de funções do 1º grau"
//                 className={inputClass}
//                 required
//               />
//               <p className="text-xs text-gray-400 mt-1 text-right">
//                 {form.assunto.length}/250
//               </p>
//             </div>

//             {/* Disciplina + Data */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Disciplina <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   value={form.disciplina}
//                   onChange={atualizar('disciplina')}
//                   className={inputClass}
//                   required
//                 >
//                   <option value="">Selecione uma disciplina</option>
//                   {disciplinas.map((d) => (
//                     <option key={d} value={d}>{d}</option>
//                   ))}
//                 </select>
//                 {disciplinas.length === 0 && (
//                   <p className="text-xs text-amber-600 mt-1">
//                     Nenhuma disciplina vinculada ao seu perfil.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Data do atendimento <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   min={hojeISO()}
//                   value={form.data_atendimento}
//                   onChange={atualizar('data_atendimento')}
//                   className={inputClass}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Tipo + Modalidade */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Tipo de atendimento
//                 </label>
//                 <Opcoes campo="tipo_atendimento" valores={TIPOS} />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Modalidade
//                 </label>
//                 <Opcoes campo="modalidade" valores={MODALIDADES} />
//               </div>
//             </div>

//             {erro && (
//               <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{erro}</p>
//             )}

//             {/* Ações */}
//             <div className="pt-2 flex items-center justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={() => navigate('/professor/atendimentos')}
//                 className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancelar
//               </button>
//               <button
//                 type="submit"
//                 disabled={!formularioValido || enviando}
//                 className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm"
//               >
//                 {enviando ? 'Salvando...' : 'Criar Atendimento'}
//               </button>
//             </div>

//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }