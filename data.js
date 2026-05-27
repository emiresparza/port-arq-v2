// Edita la reseña visible de cada página de proyecto con la propiedad "review".
// Si un proyecto no tiene "review", la plantilla oculta la reseña en vez de repetir un texto genérico.
const projects = [
  {
    "id": "antu",
    "title": "ANTÜ",
    "category": "Institucional",
    "review": "",
    "thumbnail": "assets/img/projects/antu.png",
    "hasDetails": true,
    "images": [
      "img-0.webp",
      "img-1.webp",
      "img-2.webp",
      "img-3.webp",
      "img-4.webp"
    ],
    "folderName": "antu"
  },
  {
    "id": "belmonte",
    "title": "BELMONTE",
    "category": "Residencial",
    "review": "Belmonte consistió en el diseño y habilitación de una sala de ventas y un departamento piloto para un edificio de la inmobiliaria Martabid. El encargo exigía resolver dos espacios comerciales en un plazo reducido, con capacidad para recibir clientes, comunicar valor inmobiliario y acelerar decisiones de compra.\n\nLa sala de ventas se desarrolló a partir del manual de marca de la inmobiliaria, incorporando su paleta, requerimientos operativos y criterios de presentación. Para el departamento piloto se trabajó una propuesta de interiorismo con renders, listas de compra y validaciones sucesivas, permitiendo ordenar diseño, compras y montaje.\n\nEl resultado fue una habilitación eficiente: el departamento piloto se vendió amoblado rápidamente y la sala de ventas continúa operativa.",
    "thumbnail": "assets/img/projects/belmonte.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "bienal-arq-2015",
    "title": "BIENAL ARQ 2015",
    "category": "Institucional",
    "thumbnail": "assets/img/projects/bienal-arq-2015.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "bim-panoramica",
    "title": "BIM PANORÁMICA",
    "category": "Arquitectura",
    "thumbnail": "assets/img/projects/bim-panoramica.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "branding-14arq",
    "title": "BRANDING 14ARQ",
    "category": "Branding",
    "thumbnail": "assets/img/projects/branding-14arq.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg",
      "img-5.jpg",
      "img-6.jpg"
    ],
    "folderName": "14"
  },
  {
    "id": "branding-arte-facto",
    "title": "BRANDING ARTE/FACTO",
    "category": "Branding",
    "thumbnail": "assets/img/projects/branding-arte-facto.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg",
      "img-5.jpg",
      "img-6.jpg",
      "img-7.jpg",
      "img-8.jpg"
    ],
    "folderName": "artefacto"
  },
  {
    "id": "branding-aura",
    "title": "BRANDING AURA",
    "category": "Branding",
    "thumbnail": "assets/img/projects/branding-aura.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg"
    ],
    "folderName": "aura"
  },
  {
    "id": "branding-bosquesur",
    "title": "BRANDING BOSQUESUR",
    "category": "Branding",
    "thumbnail": "assets/img/projects/branding-bosquesur.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg",
      "img-5.jpg",
      "img-6.jpg",
      "img-7.jpg",
      "img-8.jpg"
    ],
    "folderName": "bosquesur"
  },
  {
    "id": "branding-notable",
    "title": "BRANDING NOTABLE",
    "category": "Branding",
    "thumbnail": "assets/img/projects/branding-notable.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg"
    ],
    "folderName": "notable"
  },
  {
    "id": "campana-estoesatomica",
    "title": "CAMPAÑA ESTOESATÓMICA",
    "category": "Comunicación",
    "thumbnail": "assets/img/projects/campana-estoesatomica.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg"
    ],
    "folderName": "estoesatomica"
  },
  {
    "id": "casa-baier",
    "title": "CASA BAIER",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-baier.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "casa-bv",
    "title": "CASA BV",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-bv.png",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg"
    ],
    "folderName": "casa-bv"
  },
  {
    "id": "casa-cg",
    "title": "CASA CG",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-cg.png",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg"
    ],
    "folderName": "casa-cg"
  },
  {
    "id": "casa-mn",
    "title": "CASA MN",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-mn.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "casa-ter",
    "title": "CASA TER",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-ter.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "casa-vm",
    "title": "CASA VM",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/casa-vm.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "cava-del-lechon",
    "title": "CAVA DEL LECHÓN",
    "category": "Comercial",
    "thumbnail": "assets/img/projects/cava-del-lechon.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "cincocasas-llanquihue",
    "title": "CINCOCASAS LLANQUIHUE",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/cincocasas-llanquihue.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "clinica-o2",
    "title": "CLÍNICA O2",
    "category": "Salud",
    "thumbnail": "assets/img/projects/clinica-o2.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "clinica-pl",
    "title": "CLÍNICA PL",
    "category": "Salud",
    "thumbnail": "assets/img/projects/clinica-pl.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "clinica-ta",
    "title": "CLÍNICA TA",
    "category": "Salud",
    "thumbnail": "assets/img/projects/clinica-ta.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "desarrollo-grafico-caa",
    "title": "DESARROLLO GRÁFICO C.A.A.",
    "category": "Arquitectura",
    "thumbnail": "assets/img/projects/desarrollo-grafico-caa.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg"
    ],
    "folderName": "caarq"
  },
  {
    "id": "diseno-material-docente-um",
    "title": "DISEÑO MATERIAL DOCENTE UM",
    "category": "Docencia",
    "thumbnail": "assets/img/projects/diseno-material-docente-um.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg"
    ],
    "folderName": "material-um"
  },
  {
    "id": "ellas-co-portal-frances",
    "title": "ELLAS&CO PORTAL FRANCÉS",
    "category": "Comercial",
    "thumbnail": "assets/img/projects/ellas-co-portal-frances.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "fragmentos-de-humanidad",
    "title": "FRAGMENTOS DE HUMANIDAD",
    "category": "Comunicación",
    "thumbnail": "assets/img/projects/fragmentos-de-humanidad.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg",
      "img-5.jpg"
    ],
    "folderName": "fh"
  },
  {
    "id": "maqueta-publicaciones-um",
    "title": "MAQUETA PUBLICACIONES UM",
    "category": "Docencia",
    "thumbnail": "assets/img/projects/maqueta-publicaciones-um.jpg",
    "hasDetails": true,
    "images": [
      "img-0.jpg",
      "img-1.jpg",
      "img-2.jpg",
      "img-3.jpg",
      "img-4.jpg"
    ],
    "folderName": "editorialinv"
  },
  {
    "id": "oficinas-cdj-group",
    "title": "OFICINAS CDJ GROUP",
    "category": "Comercial",
    "thumbnail": "assets/img/projects/oficinas-cdj-group.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "oficinas-frindt",
    "title": "OFICINAS FRINDT",
    "category": "Comercial",
    "thumbnail": "assets/img/projects/oficinas-frindt.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "parque-olimpia",
    "title": "PARQUE OLIMPIA",
    "category": "Paisajismo",
    "thumbnail": "assets/img/projects/parque-olimpia.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "rendering-bigdreams",
    "title": "RENDERING BIGDREAMS",
    "category": "Visualización",
    "thumbnail": "assets/img/projects/rendering-bigdreams.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "rendering-lds",
    "title": "RENDERING LDS",
    "category": "Visualización",
    "thumbnail": "assets/img/projects/rendering-lds.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "taller-salfa",
    "title": "TALLER SALFA",
    "category": "Industrial",
    "thumbnail": "assets/img/projects/taller-salfa.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "tw-temuco",
    "title": "TW TEMUCO",
    "category": "Comercial",
    "thumbnail": "assets/img/projects/tw-temuco.png",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "videoinstalacion-mnfpn",
    "title": "VIDEOINSTALACIÓN MNFPN",
    "category": "Comunicación",
    "thumbnail": "assets/img/projects/videoinstalacion-mnfpn.jpg",
    "hasDetails": false,
    "images": []
  },
  {
    "id": "zen426",
    "title": "ZEN426",
    "category": "Residencial",
    "thumbnail": "assets/img/projects/zen426.png",
    "hasDetails": false,
    "images": []
  }
];

if (typeof module !== 'undefined') {
  module.exports = projects;
}
