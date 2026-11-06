// Side and front views. Coordinates share the same 80 × 80 optical grid.
// Each pose separates the apparatus, the body and the working limb.
const poses = [
 [[40,27],'M13 10H67','M40 37V51L33 63L40 68 M40 51L47 63L42 68','M39 37L25 29L21 12 M41 37L55 29L59 12'],
 [[34,24],'M12 56H44 M17 57V68 M69 19V59 M69 42L51 41','M34 34L31 51L48 51L59 61L65 56','M34 36L41 45L52 41'],
 [[34,16],'M64 38V66H56 M64 62L47 31','M34 27L33 47L29 66 M33 47L39 66','M35 29L38 43L47 31 M43 28L51 33'],
 [[30,16],'M62 42V66H53 M60 62L43 36 M41 35L47 40','M30 27L31 47L27 67 M31 47L37 67','M31 29L34 43L43 36L43 27'],
 [[40,22],'M8 32V40 M15 32V40 M65 32V40 M72 32V40','M40 32V51L33 67 M40 51L47 67','M39 33L25 35L12 36 M41 33L55 35L68 36'],
 [[39,20],'M19 14V45 M61 14V45 M30 54H49 M39 55V68','M39 32V49L29 55V65 M39 49L49 55V65','M38 32L22 31L31 25 M41 32L57 31L48 25'],
 [[34,19],'M63 65V9H54 M55 10L47 50 M42 50H53','M34 29L31 47L27 66 M31 47L38 66','M35 30L41 39L47 50'],
 [[40,19],'M66 64V48 M66 59L50 15','M39 30L38 48L32 67 M38 48L45 67','M40 31L53 23L48 11 M48 11L43 9'],
 [[39,23],'M19 10H29 M50 10H60 M26 50H51 M38 51V66','M39 34V48L27 54V65 M39 48L51 55V65','M38 33L24 30V12 M40 33L55 30V12'],
 [[40,21],'M13 21V44 M67 21V44 M29 54H50 M39 55V68','M40 33V49L31 55V66 M40 49L49 55V66','M38 34L25 30L13 25 M42 34L55 30L67 25'],
 [[38,23],'M14 65V10 M65 65V10 M14 32H65','M38 33L31 46L48 49L37 64H48','M38 35L48 37L48 30'],
 [[37,17],'M8 48H23 M12 49V65 M20 49V65 M45 48V57','M37 27L35 42L49 47L47 65H56 M35 42L27 54L18 47','M38 28L42 39L45 50'],
 [[19,33],'M7 43H26 M12 44V63 M44 28V41 M40 31V39','M26 39L43 39L58 39L61 58H69','M25 39L32 45L44 37'],
 [[46,23],'M68 14V65 M15 46L65 62','M43 33L33 43L39 56L37 67 M33 43L24 44L13 37','M44 33L54 40L65 32'],
 [[49,25],'M15 60L39 44 M23 61L41 43 M12 63H47','M43 33L33 45L18 53L13 59','M43 33L46 42L37 36']
];
function exerciseArt(id) {
 const p=poses[id];
 const body=p?'<path class="equipment" d="'+p[1]+'"/><path d="'+p[2]+'"/><circle cx="'+p[0][0]+'" cy="'+p[0][1]+'" r="5.5" fill="currentColor" stroke="none"/><path class="limb" d="'+p[3]+'"/>':'<path d="M19 47L47 19 M24 55L55 24 M14 40L32 58 M39 14L58 33"/>';
 return '<svg class="exercise-art" aria-hidden="true" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
}
const glyphs={home:'M3 10l9-7 9 7v10h-6v-7H9v7H3z',stats:'M3 19h18M4 15l5-5 4 2 7-8',history:'M5 4h12a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V5 M8 4v16M11 9h5M11 13h4',settings:'M4 7h9m4 0h3M4 17h3m4 0h9 M13 4v6M7 14v6'};
function navGlyph(id){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+glyphs[id]+'"/></svg>'}
