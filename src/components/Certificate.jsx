import React, { useRef } from 'react';
import { Download, X, Award } from 'lucide-react';

const Certificate = ({ student, onClose }) => {
    const certificateRef = useRef(null);

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* Toolbar (Mobile/Screen only) */}
                <div className="absolute top-4 right-4 z-50 flex gap-2 no-print">
                    <button onClick={handleDownload} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-110" title="Descargar/Imprimir">
                        <Download size={20} />
                    </button>
                    <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-transform hover:scale-110" title="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {/* LEFT SIDEBAR - MASCOT */}
                <div className="w-full md:w-[35%] bg-[#0070f3] relative flex items-end justify-center overflow-hidden min-h-[300px] md:min-h-[600px]">
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    {/* Mascot */}
                    <img
                        src="https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aSgL73NYClf9nf8z_mascota.svg"
                        alt="Mascota SeamosGenios"
                        className="relative z-10 w-[85%] md:w-[95%] max-w-none mb-0 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-700"
                    />
                </div>

                {/* RIGHT CONTENT */}
                <div className="w-full md:w-[65%] p-8 md:p-16 flex flex-col items-center text-center bg-white relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <img src="https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg" className="w-[80%] grayscale" alt="" />
                    </div>

                    <div className="relative z-10 w-full flex flex-col h-full">
                        {/* Header */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-900 tracking-[0.3em] uppercase mb-2">SeamosGenios</h3>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight uppercase tracking-wide">
                                Certificado
                                <span className="block text-2xl md:text-3xl font-bold text-[#0070f3] mt-1">de Participación</span>
                            </h1>
                        </div>

                        {/* Student Info */}
                        <div className="flex-grow flex flex-col justify-center mb-8">
                            <p className="text-slate-500 font-serif italic text-lg mb-4">Este documento certifica que</p>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase border-b-4 border-[#0070f3] pb-4 mb-6 inline-block mx-auto min-w-[50%]">
                                {student.nombre}
                            </h2>
                            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                                Ha participado satisfactoriamente en el <strong className="text-[#0070f3]">MINI SIMULACRO ICFES 2026-1</strong>,
                                demostrando compromiso y excelencia académica en la evaluación de las 5 asignaturas fundamentales.
                            </p>

                            {/* SCORE PLACEHOLDER */}
                            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-md mx-auto">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Puntaje Global</p>
                                <div className="text-3xl font-mono font-bold text-slate-300 flex items-center justify-center gap-2">
                                    <span>---</span> <span className="text-lg text-slate-400">/ 500</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Resultados disponibles próximamente</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mt-auto pt-8 border-t border-slate-100">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                                <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <img
                                    src="https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aSgAqHNYClf9nffD_fjasndfujiasbnfujiasdbnuijf.svg"
                                    alt="Firma"
                                    className="h-20 w-auto mb-2 filter contrast-125"
                                />
                                <div className="w-48 h-0.5 bg-slate-900 mb-2"></div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Daniel Eduardo De La Cruz Vega</p>
                                <p className="text-[10px] font-bold text-[#0070f3] uppercase">Fundador SeamosGenios</p>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            .animate-fade-in { animation: none !important; }
          }
        `}</style>
            </div>
        </div>
    );
};

export default Certificate;
