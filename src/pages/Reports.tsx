import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, FileDown } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from '../lib/storage';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const transactions = storage.getTransactions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear().toString())));
  if (!years.includes(new Date().getFullYear().toString())) years.push(new Date().getFullYear().toString());
  years.sort((a,b) => b.localeCompare(a));

  const filtered = transactions.filter(t => {
    try {
      const date = parseISO(t.date);
      if (!(date instanceof Date) || isNaN(date.getTime())) return false;
      const matchesYear = date.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === '0' || (date.getMonth() + 1).toString() === selectedMonth;
      return matchesYear && matchesMonth;
    } catch { return false; }
  });

  const summary = filtered.reduce((acc, t) => {
    if (t.type === 'entrada') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const catSpending = filtered.filter(t => t.type === 'despesa').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const monthName = selectedMonth === '0' ? 'Ano Completo' : format(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1), 'MMMM', { locale: ptBR });
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Relatório Financeiro - FinançaPro', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${monthName} de ${selectedYear}`, 14, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumo Financeiro', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Categoria', 'Valor']],
      body: [
        ['Total Receitas', `R$ ${summary.income.toFixed(2)}`],
        ['Total Gastos', `R$ ${summary.expense.toFixed(2)}`],
        ['Resultado Líquido', `R$ ${(summary.income - summary.expense).toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Detailed Transactions
    doc.setFontSize(14);
    doc.text('Detalhamento de Transações', 14, (doc as any).lastAutoTable.finalY + 15);

    const tableData = filtered
      .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .map(tx => [
        format(parseISO(tx.date), 'dd/MM/yyyy'),
        tx.description,
        tx.category,
        tx.type === 'entrada' ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${tx.amount.toFixed(2)}`
      ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Data', 'Descrição', 'Categoria', 'Valor']],
      body: tableData,
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: {
        3: { halign: 'right' }
      }
    });

    doc.save(`relatorio_${selectedYear}_${selectedMonth}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = filtered.map(t => [
      format(parseISO(t.date), 'dd/MM/yyyy'),
      t.description,
      t.category,
      t.type,
      t.amount.toString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="card grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
        <div className="col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ano</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="input-field text-xs sm:text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Mês</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input-field text-xs sm:text-sm">
            <option value="0">Todos</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{format(new Date(2022, i, 1), 'MMMM', { locale: ptBR })}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-end">
          <button onClick={exportToCSV} className="btn-secondary w-full py-2.5 sm:py-2 flex items-center justify-center gap-2 text-xs font-bold">
            <Download size={16} /> <span className="sm:hidden">CSV</span><span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-end">
          <button onClick={exportToPDF} className="btn-primary w-full py-2.5 sm:py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-blue-500/10">
            <FileDown size={16} /> <span className="sm:hidden">PDF</span><span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden border-none sm:border-slate-100">
          <div className="p-5 sm:p-6 border-b border-slate-50 flex justify-between items-center bg-white">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tighter">Detalhamento</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{filtered.length} lançamentos</span>
          </div>
          
          <div className="block sm:hidden divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filtered.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(tx => (
              <div key={tx.id} className="p-4 bg-white flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-black text-slate-900 truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400">{format(parseISO(tx.date), 'dd/MM/yy')}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tight">{tx.category}</span>
                  </div>
                </div>
                <div className={cn("font-black text-sm shrink-0", tx.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900')}>
                  {tx.type === 'entrada' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-400 italic text-sm">
                Nenhum lançamento no período.
              </div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto max-h-[600px] scrollbar-hide">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filtered.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-xs">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{tx.description}</td>
                    <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{tx.category}</span></td>
                    <td className={cn("px-6 py-4 text-right font-black", tx.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900')}>
                      R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="card p-5 sm:p-6 bg-slate-900 text-white border-none relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mb-16 -mr-16 blur-2xl" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Resumo</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Receitas</span>
                <span className="font-black text-emerald-400">R$ {summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Despesas</span>
                <span className="font-black text-rose-400">R$ {summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-white tracking-wider">Líquido</span>
                <span className={cn("font-black text-lg", (summary.income - summary.expense) >= 0 ? 'text-blue-400' : 'text-rose-400')}>
                  R$ {(summary.income - summary.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Por Categoria</h3>
            <div className="space-y-4">
              {Object.entries(catSpending).sort(([,a],[,b]) => b - a).map(([cat, val], idx) => (
                <div key={cat} className="group">
                  <div className="flex justify-between items-center text-xs font-black mb-2">
                    <span className="text-slate-600 truncate mr-2">{cat}</span>
                    <span className="text-slate-900">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / summary.expense) * 100}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        idx === 0 ? "bg-blue-600" : idx === 1 ? "bg-indigo-500" : "bg-slate-400"
                      )} 
                    />
                  </div>
                </div>
              ))}
              {Object.keys(catSpending).length === 0 && (
                <p className="text-center text-slate-400 italic text-[10px] py-4 uppercase font-black">Sem despesas registradas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
