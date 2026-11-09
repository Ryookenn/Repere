const apparatus = [
 'M6 20l7-7h38l7 7 M16 15l-6 7m38-7 6 7 M25 13V7h14v6',
 'M6 43h20v5H6z M10 48v6m12-6v6 M29 44l9-12 5 3-9 12z M48 11h9v43h-9z M48 32H34l-6-4',
 'M48 10h8v42h-8z M48 47L30 29 M14 21l6 5h15l6-5 M26 26l4 3',
 'M47 10h8v43h-8z M47 47L30 25 M30 25l-9 13m9-13 5 15 M18 37l6 4m8-1 6-2',
 'M9 24h5v16H9z M15 20h7v24h-7z M22 29h20v6H22z M42 20h7v24h-7z M50 24h5v16h-5z',
 'M23 40h18v5H23z M32 45v9 M11 14v15l10 7m32-22v15l-10 7 M8 15h6v12H8z M50 15h6v12h-6z',
 'M46 51V11H30v5 M30 16v17 M16 40l14-7 14 7 M13 39l5 4m24-4 5 1',
 'M48 51V11H34 M34 11L19 28 M19 28l3 12m-3-12-8 10 M9 38l4 3m7-1 5-1',
 'M15 16v13l10 8m24-21v13l-10 8 M10 16h11m22 0h11 M26 42h12v5H26z M32 47v7',
 'M11 31l5-14 15 9m22 5-5-14-15 9 M9 31v8m46-8v8 M25 43h14v5H25z M32 48v6',
 'M13 9h4v44h-4z M47 9h4v44h-4z M7 25h50 M20 21h4v8h-4z M40 21h4v8h-4z M8 54h15m18 0h15',
 'M6 31h29v5H6z M10 36l-3 15m23-15 4 15 M39 39h5v13h-5z M45 44h6m1-5h5v13h-5z',
 'M6 26h23v6H6z M10 32v17m14-17v17 M34 31h6v16h-6z M40 37h11m0-6h6v16h-6z',
 'M48 11h8v42h-8z M48 48l-21-8 M11 33l16 3-2 12-16-3z M13 38l10 2',
 'M9 48l30-25 4 5-30 25z M33 21l10-8 6 7-10 8z M24 40l9 12 M8 54h36 M11 43l-4-5'
];
function exerciseArt(id){
 const path=apparatus[id]||'M13 27h7v14h-7z M20 32h24m0-5h7v14h-7z';
 return '<svg class="exercise-art" aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
}
const glyphs={home:'M3 10l9-7 9 7v10h-6v-7H9v7H3z',stats:'M3 19h18M4 15l5-5 4 2 7-8',history:'M5 4h12a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V5 M8 4v16M11 9h5M11 13h4',settings:'M4 7h9m4 0h3M4 17h3m4 0h9 M13 4v6M7 14v6'};
function navGlyph(id){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+glyphs[id]+'"/></svg>'}
