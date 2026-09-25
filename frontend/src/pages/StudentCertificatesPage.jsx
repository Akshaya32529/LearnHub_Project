import React, { useEffect, useState } from 'react';
import { Award, Printer, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/progress/certificates').then(({ data }) => setCertificates(data.certificates || []))
      .catch((err) => setError(err.message || 'Certificates could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);
  return <main className="mx-auto max-w-5xl px-4 py-10">
    <header className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Achievement history</p><h1 className="mt-2 text-3xl font-extrabold">Your certificates</h1><p className="mt-2 text-sm text-slate-600">Print a certificate for every course you have completed.</p></header>
    {error && <p role="alert" className="mb-5 flex gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</p>}
    {loading ? <p className="py-16 text-center text-sm text-slate-500">Loading certificates…</p> : certificates.length ? <div className="space-y-6">{certificates.map((certificate) => <article key={certificate._id} className="certificate-card rounded-3xl border-4 border-double border-amber-300 bg-white p-8 text-center shadow-sm sm:p-12"><Award className="mx-auto h-12 w-12 text-amber-500"/><p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">LearnHub Certificate of Completion</p><h2 className="mt-5 text-3xl font-extrabold text-slate-900">{certificate.course?.title || 'Completed course'}</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">This certifies that the learner has completed all required lessons and assessments for this course.</p><p className="mt-7 text-lg font-bold text-slate-900">{certificate.student?.name || 'LearnHub learner'}</p><p className="mt-2 text-sm text-slate-600">Completed {new Date(certificate.completionDate).toLocaleDateString()}</p><p className="mt-5 font-mono text-xs text-slate-500">Certificate ID: {certificate.certificateNumber}</p><button onClick={() => window.print()} className="no-print mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white"><Printer className="h-4 w-4"/>Print / Save PDF</button></article>)}</div> : <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">Certificates will appear here after you complete a course.</div>}
    <style>{'@media print { body * { visibility: hidden; } .certificate-card, .certificate-card * { visibility: visible; } .certificate-card { position: absolute; inset: 0; box-shadow: none; } .no-print { display: none !important; } }'}</style>
  </main>;
}
