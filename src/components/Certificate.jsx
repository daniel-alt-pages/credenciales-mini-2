import React, { useRef, useState, useEffect } from 'react';
import { Download, X, Loader2, Award, CheckCircle2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import cubesImg from '../assets/images/cubes.png';
import mascotaImg from '../assets/images/mascota.svg';
import servicesLogoImg from '../assets/images/ServicesLogo.svg';
import firmaImg from '../assets/images/firma.svg';

const Certificate = ({ student, onClose }) => {
    const certificateRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [scale, setScale] = useState(1);

    // 2. Interfaz de Usuario (UI) Tipo "Google Drive"
    // Lógica de escalado responsivo
    useEffect(() => {
        const handleResize = () => {
            const containerWidth = window.innerWidth - 40; // Margen de 20px a cada lado
            const containerHeight = window.innerHeight - 40;

            const targetWidth = 1123; // Ancho A4 Landscape en px (96 DPI)
            const targetHeight = 794; // Alto A4 Landscape en px

            // Calcular escala basada en el ancho (prioridad)
            let newScale = containerWidth / targetWidth;

            // Si la altura también es un factor limitante (pantallas muy apaisadas pero bajas), ajustar
            if (targetHeight * newScale > containerHeight) {
                newScale = containerHeight / targetHeight;
            }

            // Limitar escala máxima a 1 (no agrandar más allá del tamaño real)
            setScale(Math.min(newScale, 1));
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Lógica de Descarga "Landscape Forzado"
    const handleDownload = async () => {
        if (!certificateRef.current || isDownloading) return;
        setIsDownloading(true);

        try {
            const element = certificateRef.current;
            const safeName = (student.nombre || 'estudiante').replace(/[^a-z0-9]/gi, '_').toLowerCase();

            // Capturar el DOM como PNG de alta calidad
            const dataUrl = await htmlToImage.toPng(element, {
                quality: 1.0,
                pixelRatio: 2, // Doble resolución para nitidez
                width: 1123,   // Forzar ancho A4
                height: 794,   // Forzar alto A4
                cacheBust: true,
                skipAutoScale: true,
                style: {
                    transform: 'none', // Ignorar el escalado de la vista previa
                    margin: '0',
                    padding: '0',
                    width: '1123px',
                    height: '794px',
                    transformOrigin: 'top left'
                },
                filter: (node) => !node.classList?.contains('no-print') // Excluir botones
            });

            // Generar PDF Landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1123, 794]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, 1123, 794);
            pdf.save(`Certificado_${safeName}.pdf`);

        } catch (err) {
            console.error("Error generando certificado:", err);
            alert("Hubo un error al generar el certificado. Intenta de nuevo.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        // Contenedor visual tipo "Google Drive" (Fondo oscuro, centrado)
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden animate-fade-in">

            {/* Toolbar Flotante */}
            <div className="absolute top-4 right-4 z-50 flex gap-2 no-print">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Descargar PDF</span>
                </button>
                <button
                    onClick={onClose}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Área de visualización centrada */}
            <div className="relative flex items-center justify-center w-full h-full p-4">
                {/* Hoja del Certificado */}
                <div
                    ref={certificateRef}
                    style={{
                        transform: `scale(${scale})`,
                        width: '1123px',
                        height: '794px',
                        minWidth: '1123px',
                        minHeight: '794px',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)' // Sombra para efecto "hoja"
                    }}
                    className="bg-white relative flex flex-row overflow-hidden shrink-0 rounded-sm"
                >
                    {/* LEFT SIDEBAR - MASCOT */}
                    <div className="w-[30%] bg-[#0070f3] relative flex items-end justify-center overflow-hidden h-full pb-8">
                        <div
                            className="absolute inset-0 opacity-10 bg-repeat"
                            style={{ backgroundImage: `url(${cubesImg})` }}
                        ></div>

                        {/* Watermark Text */}
                        <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none select-none overflow-hidden py-4">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="text-white font-black text-4xl whitespace-nowrap transform -rotate-12 origin-center tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    SEAMOSGENIOS   SEAMOSGENIOS
                                </div>
                            ))}
                        </div>

                        <img
                            src={mascotaImg}
                            alt="Mascota"
                            className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-2xl scale-125 transform -translate-y-24"
                        />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="w-[70%] p-12 flex flex-col items-center text-center relative h-full justify-between bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-slate-50">

                        {/* Watermark Logo (Background) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                            <img src={servicesLogoImg} className="w-[80%] grayscale" alt="" />
                        </div>

                        <div className="relative z-10 w-full flex flex-col h-full items-center">
                            {/* Top Header */}
                            <div className="mt-8 mb-4">
                                <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.6em] uppercase mb-2">SEAMOSGENIOS COLOMBIA</h3>
                                <h1 className="text-5xl font-black text-[#002060] leading-none uppercase tracking-[0.15em] mb-2 drop-shadow-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    CERTIFICADO
                                </h1>
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <div className="h-px w-8 bg-[#0070f3]"></div>
                                    <h2 className="text-xl font-bold text-[#0070f3] uppercase tracking-widest">
                                        DE PARTICIPACIÓN
                                    </h2>
                                    <div className="h-px w-8 bg-[#0070f3]"></div>
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="flex-grow flex flex-col justify-center w-full max-w-3xl items-center">
                                <p className="text-slate-500 font-serif italic text-xl mb-6">Este documento certifica que</p>

                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#002060] to-[#004080] uppercase mb-6 break-words leading-tight drop-shadow-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    {student.nombre}
                                </h2>

                                {/* Blue Separator Line - 40% Width */}
                                <div className="w-[40%] h-1 bg-[#0070f3] mb-8"></div>

                                <p className="text-slate-600 text-lg leading-relaxed font-medium px-8">
                                    Ha participado satisfactoriamente en el <strong className="text-[#0070f3]">MINISIMULACRO ICFES 2026-1</strong>,
                                    demostrando compromiso y excelencia académica.
                                </p>

                                {/* Score Section - Minimalist */}
                                <div className="mt-8 flex items-center justify-center gap-6 py-4 border-y border-slate-200 w-full max-w-lg relative">
                                    {/* Background Pattern for Score */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>

                                    {/* Logo */}
                                    <img src={servicesLogoImg} className="h-10 w-auto opacity-90 brightness-0 drop-shadow-md" alt="Logo" />

                                    <div className="w-px h-8 bg-slate-300"></div>

                                    {/* Official Badge (Moved here) */}
                                    <div className="flex flex-col items-center opacity-80">
                                        <div className="w-8 h-8 rounded-full border border-[#002060] flex items-center justify-center mb-0.5">
                                            <Award className="text-[#002060]" size={16} />
                                        </div>
                                        <span className="text-[6px] font-bold tracking-widest text-[#002060] uppercase">Oficial</span>
                                    </div>

                                    <div className="w-px h-8 bg-slate-300"></div>

                                    {/* Score */}
                                    <div className="flex flex-col items-start z-10">
                                        <span className="text-[8px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-0.5">Puntaje Global</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-mono font-black text-slate-700">---</span>
                                            <span className="text-xs text-slate-400 font-medium">/ 500</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="w-full flex flex-row justify-between items-end mt-auto pt-8 border-t border-slate-100/50">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">FECHA DE EMISIÓN</p>
                                    <p className="text-lg font-bold text-slate-800 uppercase">27 de noviembre de 2025</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <img
                                        src={firmaImg}
                                        alt="Firma"
                                        className="h-[70px] w-auto mb-[-10px] z-10 filter contrast-125"
                                    />
                                    <div className="w-48 h-0.5 bg-slate-900 mb-2 relative z-0"></div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider">DANIEL DE LA CRUZ</p>
                                    <p className="text-[10px] font-bold text-[#0070f3] uppercase">DIRECTOR GENERAL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Blue Bottom Line */}
                    <div className="absolute bottom-0 left-0 w-full h-[15px] bg-[#0070f3] z-30"></div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div >
    );
};

export default Certificate;
