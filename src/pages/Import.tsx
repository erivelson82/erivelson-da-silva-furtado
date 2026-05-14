import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Save, FileType, FileSearch } from 'lucide-react';
import { storage } from '../lib/storage';
import { Transaction } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as PDFJS from 'pdfjs-dist';
import * as XLSX from 'xlsx';

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Partial<Transaction>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize PDF.js worker safely
    try {
      PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.7.284/pdf.worker.min.mjs`;
    } catch (e) {
      console.warn("Could not load PDF worker:", e);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    const files = e.target.files ? Array.from(e.target.files) as File[] : [];
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    
    const allResults: Partial<Transaction>[] = [];
    
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      try {
        let results: Partial<Transaction>[] = [];
        if (extension === 'csv') {
          results = await processCSV(file);
        } else if (extension === 'pdf') {
          results = await processPDF(file);
        } else if (extension === 'xlsx' || extension === 'xls') {
          results = await processExcel(file);
        } else {
          console.warn(`File skipped: ${file.name} (unsupported)`);
          continue;
        }
        allResults.push(...results);
      } catch (err: any) {
        console.error(`Error processing ${file.name}:`, err);
      }
    }

    if (allResults.length > 0) {
      setParsedTransactions(prev => [...prev, ...allResults]);
    } else if (files.length > 0) {
      setError('Não foi possível encontrar transações válidas nos arquivos enviados.');
    }
    
    setIsProcessing(false);
  };

  const processCSV = (file: File): Promise<Partial<Transaction>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const results: Partial<Transaction>[] = [];
          const now = new Date().toISOString().split('T')[0];

          for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(/[,;]/);
            if (cols.length < 2) continue;

            // Tenta encontrar um valor numérico em qualquer coluna
            let amount = NaN;
            let amountColIndex = -1;

            for (let j = 0; j < cols.length; j++) {
              const raw = cols[j]?.trim();
              if (!raw) continue;
              
              // Se parece com uma data, pula
              if (raw.match(/\d{2}\/\d{2}/) || raw.match(/\d{4}-\d{2}-\d{2}/)) continue;

              const cleaned = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
              const val = parseFloat(cleaned);
              if (!isNaN(val) && Math.abs(val) > 0) {
                amount = val;
                amountColIndex = j;
                break; 
              }
            }

            if (!isNaN(amount)) {
              let date = now;
              let description = 'Importado CSV';

              // Tenta encontrar uma data
              for (let j = 0; j < cols.length; j++) {
                const dateMatch = cols[j]?.match(/(\d{2})\/(\d{2})\/(\d{4}|\d{2})/);
                if (dateMatch) {
                  const [_, d, m, y] = dateMatch;
                  const year = y.length === 2 ? `20${y}` : y;
                  date = `${year}-${m}-${d}`;
                  break;
                }
              }

              // Descrição é a primeira coluna que não é data nem valor, ou apenas a primeira coluna
              for (let j = 0; j < cols.length; j++) {
                if (j !== amountColIndex && !cols[j].match(/\d{2}\/\d{2}/)) {
                   description = cols[j]?.trim().replace(/"/g, '') || description;
                   break;
                }
              }

              results.push({
                id: Math.random().toString(36).substring(2, 11),
                date: date,
                description: description,
                amount: Math.abs(amount),
                type: amount < 0 ? 'despesa' : 'entrada',
                category: 'Outros'
              });
            }
          }
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
      reader.readAsText(file);
    });
  };

  const processExcel = (file: File): Promise<Partial<Transaction>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          
          const results: Partial<Transaction>[] = [];
          const now = new Date().toISOString().split('T')[0];

          jsonData.forEach(row => {
            if (row.length < 2) return;

            let amount = NaN;
            let amountIdx = -1;

            row.forEach((cell, idx) => {
              if (amountIdx !== -1) return;
              const raw = cell?.toString().trim();
              if (!raw) return;

              // Pula se parecer data
              if (raw.match(/\d{2}\/\d{2}/) || raw.match(/\d{4}-\d{2}-\d{2}/)) return;

              const cleaned = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
              const val = parseFloat(cleaned);
              if (!isNaN(val) && Math.abs(val) > 0) {
                amount = val;
                amountIdx = idx;
              }
            });

            if (!isNaN(amount)) {
              let date = now;
              let description = 'Importado Excel';

              row.forEach((cell) => {
                const rawDate = cell?.toString();
                const dateMatch = rawDate?.match(/(\d{2})\/(\d{2})\/(\d{4}|\d{2})/);
                if (dateMatch) {
                  const [_, d, m, y] = dateMatch;
                  const year = y.length === 2 ? `20${y}` : y;
                  date = `${year}-${m}-${d}`;
                }
              });

              description = row[0]?.toString() || description;

              results.push({
                id: Math.random().toString(36).substring(2, 11),
                date: date,
                description: description,
                amount: Math.abs(amount),
                type: amount < 0 ? 'despesa' : 'entrada',
                category: 'Outros'
              });
            }
          });
          
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo Excel'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processPDF = async (file: File): Promise<Partial<Transaction>[]> => {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = PDFJS.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    const lines = fullText.split('\n');
    const results: Partial<Transaction>[] = [];
    const now = new Date().toISOString().split('T')[0];
    
    const amountRegex = /(-?\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\d+(?:\.\d{2})?)/g;
    const dateRegex = /(\d{2})\/(\d{2})(?:\/(\d{4}|\d{2}))?/;

    lines.forEach(line => {
      let date = now;
      let cleanLine = line;

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const [fullDateMatch, d, m, y] = dateMatch;
        const currentYear = new Date().getFullYear();
        const year = y ? (y.length === 2 ? `20${y}` : y) : currentYear;
        date = `${year}-${m}-${d}`;
        // Remove a data para não ser confundida com valor
        cleanLine = line.split(fullDateMatch).join(' ');
      }

      const amountMatches = cleanLine.match(amountRegex);
      if (amountMatches) {
        for (const amountStr of amountMatches) {
          const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
          
          if (!isNaN(amount) && Math.abs(amount) > 0.1) {
            let description = cleanLine.replace(amountStr, '').trim();
            
            description = description.replace(/^\s?(-|:)?\s?/, '');
            if (description.length > 60) description = description.substring(0, 60) + '...';

            results.push({
              id: Math.random().toString(36).substring(2, 11),
              date: date,
              description: description || 'Importado PDF',
              amount: Math.abs(amount),
              type: amount < 0 ? 'despesa' : 'entrada',
              category: 'Outros'
            });
          }
        }
      }
    });

    return results;
  };

  const handleSaveAll = () => {
    if (parsedTransactions.length === 0) return;

    const current = storage.getTransactions();
    const toSave = parsedTransactions.map(t => ({
      ...t,
      id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      category: t.category || 'Outros',
      date: t.date || new Date().toISOString().split('T')[0],
      amount: t.amount || 0,
      description: t.description || 'Importado',
      type: t.type || 'despesa'
    })) as Transaction[];

    storage.setTransactions([...toSave, ...current]);
    setParsedTransactions([]);
    alert(`${toSave.length} transações importadas e salvas com sucesso!`);
  };

  const removeParsed = (id: string) => {
    setParsedTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Importar Dados</h2>
        <p className="text-slate-500">Arraste seus extratos bancários em PDF, CSV ou Excel para começar.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 overflow-hidden"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {true ? (
        <div className="space-y-6">
          <div 
            onClick={() => {
              if (!isProcessing) fileInputRef.current?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden",
              isDragging 
                ? "border-blue-500 bg-blue-50 scale-[0.99]" 
                : "border-slate-200 hover:border-blue-400 bg-white",
              isProcessing && "opacity-50 cursor-wait pointer-events-none",
              parsedTransactions.length > 0 && "py-6"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              className="hidden" 
              accept=".pdf,.csv,.xlsx,.xls"
              multiple
            />
            
            <div className={cn(
              "rounded-full flex items-center justify-center transition-all duration-500",
              parsedTransactions.length > 0 ? "w-10 h-10 mb-2" : "w-20 h-20 mb-6",
              isProcessing ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-slate-50 text-slate-400 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500"
            )}>
              {isProcessing ? <FileSearch size={parsedTransactions.length > 0 ? 16 : 32} /> : <Upload size={parsedTransactions.length > 0 ? 16 : 32} />}
            </div>

            <p className={cn("font-bold text-slate-800", parsedTransactions.length > 0 ? "text-sm" : "text-xl mb-2")}>
              {isProcessing ? "Analisando..." : parsedTransactions.length > 0 ? "Adicionar mais arquivos" : "Clique ou arraste um arquivo"}
            </p>
            {!parsedTransactions.length && <p className="text-sm text-slate-400">Suporta extensões PDF, CSV, XLSX e XLS</p>}
          </div>

          {parsedTransactions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                    <FileType size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{parsedTransactions.length} transações</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Revise antes de salvar</p>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <button 
                    type="button"
                    onClick={() => setParsedTransactions([])}
                    className="btn-secondary flex-1 sm:flex-none px-4 py-2 text-xs"
                  >
                    Limpar
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveAll}
                    className="btn-primary flex-1 sm:flex-none px-6 py-2 text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Salvar Tudo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide">
                {parsedTransactions.map((tx, index) => (
                  <div key={`${tx.id}-${index}`} className="card bg-white hover:border-blue-200 transition-colors py-3 px-3 sm:px-4 group">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input 
                            type="text" 
                            value={tx.description} 
                            onChange={(e) => {
                              const newDesc = e.target.value;
                              setParsedTransactions(prev => prev.map((p, i) => i === index ? {...p, description: newDesc} : p));
                            }}
                            className="text-sm font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full truncate"
                          />
                          <input 
                            type="date"
                            value={tx.date}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setParsedTransactions(prev => prev.map((p, i) => i === index ? {...p, date: newDate} : p));
                            }}
                            className="text-[10px] text-slate-400 uppercase font-black bg-transparent border-none p-0 focus:ring-0"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                        <button 
                          type="button"
                          onClick={() => {
                            setParsedTransactions(prev => prev.map((p, i) => i === index ? {...p, type: p.type === 'entrada' ? 'despesa' : 'entrada'} : p));
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-sm",
                            tx.type === 'entrada' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {tx.type}
                        </button>
                        <div className="text-right flex-1 sm:flex-none">
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                             <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">R$</span>
                             <input 
                              type="number" 
                              step="0.01"
                              value={tx.amount}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value);
                                setParsedTransactions(prev => prev.map((p, i) => i === index ? {...p, amount: newAmount} : p));
                              }}
                              className={cn(
                                "text-sm sm:text-base font-black bg-transparent border-none p-0 focus:ring-0 text-right w-20 sm:w-24",
                                tx.type === 'entrada' ? 'text-emerald-500' : 'text-slate-900'
                              )}
                            />
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeParsed(tx.id!)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl p-2 transition-all shrink-0"
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : null}

      <div className="card bg-amber-50 border-amber-100 p-6 flex gap-4">
        <div className="bg-amber-100 text-amber-600 p-3 rounded-full h-fit">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Como funciona a importação?</h4>
          <p className="text-sm text-amber-700 leading-relaxed">
            Nosso sistema analisa o texto do seu arquivo PDF ou CSV em busca de descrições e valores. 
            Devido à variedade de formatos bancários, recomendamos que você <strong>verifique os valores antes de salvar</strong>. 
            Você pode editar qualquer campo diretamente na lista de prévia.
          </p>
        </div>
      </div>
    </div>
  );
}
