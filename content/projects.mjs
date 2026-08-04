const projectImage = (folder, file, alt) => [
  `/assets/img/project-details/${folder}/${file}`,
  alt
];

export const projects = [
  {
    slug: "antu",
    title: "ANTU",
    category: "Arquitectura",
    location: "Temuco",
    status: "Anteproyecto",
    developedBy: "Emir Esparza - Nicolás Larraguibel",
    scope: "Arquitectura, Interiorismo, BIM, Render",
    description: "Centro de eventos ubicado en el paisaje de humedales de la Araucanía. El proyecto busca crear un lugar de encuentro conectado con su entorno, capaz de recibir celebraciones, reuniones y actividades comunitarias. La arquitectura se eleva sobre el terreno mediante una estructura de madera laminada, reduciendo el impacto sobre el suelo. Un sistema de pasarelas organiza los recorridos y permite habitar el paisaje respetando sus condiciones naturales.",
    cover: "/assets/img/project-details/antu/img-0.webp",
    images: [
      projectImage("antu", "img-0.webp", "Vista general del proyecto ANTU"),
      projectImage("antu", "img-1.webp", "Espacio interior y materialidad del proyecto ANTU"),
      projectImage("antu", "img-2.webp", "Detalle de arquitectura interior del proyecto ANTU"),
      projectImage("antu", "img-3.webp", "Relación entre iluminación y superficies en ANTU"),
      projectImage("antu", "img-4.webp", "Vista complementaria de los espacios de ANTU")
    ],
    related: ["casa-al", "casa-bv", "casa-ca"]
  },
  {
    slug: "render-bd",
    title: "RENDER BD",
    category: "Visualización",
    location: "Temuco",
    status: "Anteproyecto",
    developedBy: "Natalia Acuña - Emir Esparza",
    client: "Objeto de Diseño - Natalia Acuña ARQ",
    scope: "Render, Interiorismo, Mobiliario, Archviz",
    description: "Serie de visualizaciones en render desarrolladas para presentar el anteproyecto con claridad, síntesis y carácter. Las imágenes construyen una lectura coherente de la propuesta, transmitiendo su atmósfera, intención espacial y principales decisiones de diseño.",
    cover: "/assets/img/project-details/Big Dreams/Renders/A.png",
    images: [
      projectImage("Big Dreams", "Renders/A.png", "Recepción y acceso principal de RENDER BD"),
      projectImage("Big Dreams", "Renders/B.png", "Área flexible de encuentro y aprendizaje en RENDER BD"),
      projectImage("Big Dreams", "Renders/C(3).png", "Sala multiuso y proyección de RENDER BD"),
      projectImage("Big Dreams", "Renders/D.png", "Zona de juego integrada de RENDER BD")
    ],
    related: ["laderas-del-sur", "cdl", "oficina-le"]
  },
  {
    slug: "casa-al",
    title: "CASA AL",
    category: "Arquitectura",
    location: "Cunco",
    status: "Construida",
    developedBy: "Emir Esparza - Karen",
    scope: "Arquitectura, Interiorismo, BIM, Render",
    description: "Vivienda rural de un nivel diseñada para una pareja de adultos mayores. Su organización se resuelve en torno a una amplia cocina central que conecta los dormitorios con las áreas de trabajo y apoyo. Construida principalmente en madera y paneles SIP la vivienda prioriza el confort térmico, la luz natural y la eficiencia constructiva. La doble altura del espacio común reúne las principales actividades de la casa y concentra la vida cotidiana de sus habitantes.",
    cover: "/assets/img/project-details/Casa Alicia/Renders/A.png",
    images: [
      projectImage("Casa Alicia", "Renders/A.png", "Vista exterior principal de CASA AL"),
      projectImage("Casa Alicia", "Renders/B.png", "Volúmenes y acceso de CASA AL"),
      projectImage("Casa Alicia", "Renders/C.png", "Acceso cubierto y materialidad de CASA AL"),
      projectImage("Casa Alicia", "Renders/D.png", "Relación entre los volúmenes de CASA AL"),
      projectImage("Casa Alicia", "Renders/E.png", "Implantación de CASA AL en el paisaje"),
      projectImage("Casa Alicia", "Renders/F.png", "Cocina y espacio común de CASA AL"),
      projectImage("Casa Alicia", "Renders/G.png", "Terraza protegida y conexión interior exterior de CASA AL")
    ],
    related: ["casa-bv", "casa-ca", "antu"]
  },
  {
    slug: "casa-bv",
    title: "CASA BV",
    category: "Arquitectura",
    location: "Pucón",
    status: "Construida",
    developedBy: "Emir Esparza - Nicolás Larraguibel",
    scope: "Arquitectura, Interiorismo, Render",
    description: "Remodelación de vivienda recreacional en las cercanías de Pucón. El proyecto consiste en la reutilización de una estructura existente para reimaginar una vivienda de fin de semana. Se desarrolla una batería de dormitorios conectados a un espacio común amplio que integra cocina, comedor y estar en un solo ambiente compartido. La estética de la casa privilegia el uso de materiales locales de la cordillera como la madera en exteriores e interiores pétreos de bajo mantenimiento, que puedan soportar largas temporadas sin uso sin deteriorarse.",
    cover: "/assets/img/project-details/Casa BV/ChatGPT Image 27 may 2026, 11_34_37 p.m..png",
    images: [
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_37 p.m..png", "Vista exterior principal de CASA BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_30 p.m..png", "Acceso y fachada de CASA BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_27 p.m..png", "Volumen posterior y materialidad de CASA BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_35_24 p.m..png", "Fachada longitudinal y terraza de CASA BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_21 p.m..png", "Espacio interior y vistas al paisaje de CASA BV")
    ],
    related: ["casa-al", "casa-ca", "antu"]
  },
  {
    slug: "casa-ca",
    title: "CASA CA",
    category: "Arquitectura",
    location: "Lautaro",
    status: "Proyecto",
    developedBy: "Emir Esparza - Nicolás Larraguibel",
    scope: "Arquitectura, Interiorismo, Render",
    description: "Vivienda unifamiliar con comercio en Lautaro. El proyecto se resuelve mediante una estructura y revestimientos de madera, integrándose con la arquitectura del entorno. Hacia el frente, una entrada de doble circulación separa claramente el acceso residencial del comercial. El diseño y sus especificaciones se desarrollan conforme a los requisitos técnicos y normativos necesarios para la tramitación de la resolución sanitaria y MEF.",
    cover: "/assets/img/project-details/casa-cg/img-0.jpg",
    images: [
      projectImage("casa-cg", "img-0.jpg", "Vista exterior de CASA CA"),
      projectImage("casa-cg", "img-1.jpg", "Acceso y composición volumétrica de CASA CA"),
      projectImage("casa-cg", "img-2.jpg", "Espacio interior de CASA CA"),
      projectImage("casa-cg", "img-3.jpg", "Relación interior exterior en CASA CA"),
      projectImage("casa-cg", "img-4.jpg", "Detalle de materialidad de CASA CA")
    ],
    related: ["casa-bv", "casa-al", "antu"]
  },
  {
    slug: "cdl",
    title: "TIENDA CDL",
    category: "Interiorismo",
    location: "Temuco",
    status: "Construido",
    developedBy: "MaríaDesign - Emir Esparza - Josefina Carrasco",
    scope: "Interiorismo, Render",
    description: "Habilitación de local comercial para convertir un local existente en una tienda premium de vinos, licores, charcutería y panadería. El encargo exigía trabajar sobre una base preexistente, reutilizar maderas y responder a términos de referencia dados por el cliente para góndolas, mobiliario y áreas de exhibición. La idea principal fue construir una atmósfera cercana a un bodegón europeo mediterráneo, usando maderas tratadas reutilizadas, metales y materiales terracota. Esta estética debía convivir con el alto tráfico y el fácil mantenimiento.",
    cover: "/assets/img/project-details/CdL/Render/Enscape_2024-08-16-17-14-16.png",
    images: [
      projectImage("CdL", "Render/Enscape_2024-08-16-17-14-16.png", "Vista general de TIENDA CDL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-14-51.png", "Área de atención y exhibición de TIENDA CDL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-19-01.png", "Mobiliario y recorridos interiores de TIENDA CDL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-22-46.png", "Detalle de estanterías y mesón de TIENDA CDL")
    ],
    related: ["render-bd", "oficina-le", "quincho-ss"]
  },
  {
    slug: "homeoffice-cg",
    title: "HOMEOFFICE CG",
    category: "Workspaces",
    location: "Temuco",
    status: "Construido",
    developedBy: "Emir Esparza - Karen Moller",
    scope: "Interiorismo, Render",
    description: "Renovación de una habitación para transformarla en un espacio de trabajo cómodo, contemporáneo y funcional, integrado de manera natural a la vida cotidiana de la vivienda. El proyecto reemplaza las soluciones improvisadas por un ambiente pensado en detalle, con identidad propia y una organización clara que favorece la concentración, el orden y el trabajo diario.",
    cover: "/assets/img/project-details/Homeoffice CG/Renders/A3.png",
    images: [
      projectImage("Homeoffice CG", "Renders/A3.png", "Vista general de HOMEOFFICE CG"),
      projectImage("Homeoffice CG", "Renders/A4.png", "Puestos de trabajo y almacenamiento de HOMEOFFICE CG"),
      projectImage("Homeoffice CG", "Renders/A1.png", "Mobiliario integrado de HOMEOFFICE CG"),
      projectImage("Homeoffice CG", "Renders/A2.png", "Acceso y volumen de guardado de HOMEOFFICE CG"),
      projectImage("Homeoffice CG", "Fotos Terminado/A.jpeg", "Acceso a HOMEOFFICE CG construido"),
      projectImage("Homeoffice CG", "Fotos Terminado/B.jpeg", "Superficie de trabajo bajo cubierta"),
      projectImage("Homeoffice CG", "Fotos Terminado/C.jpeg", "Encuentro del escritorio y el mobiliario"),
      projectImage("Homeoffice CG", "Fotos Terminado/D.jpeg", "Iluminación integrada del espacio"),
      projectImage("Homeoffice CG", "Fotos Terminado/E.jpeg", "Revestimiento y luz del espacio terminado"),
      projectImage("Homeoffice CG", "Fotos Terminado/F.jpeg", "Detalle del puesto de trabajo construido"),
      projectImage("Homeoffice CG", "Fotos Terminado/G.jpeg", "Mueble de guardado y acceso")
    ],
    related: ["oficina-le", "cdl", "quincho-ss"]
  },
  {
    slug: "oficina-le",
    title: "OFICINA LE",
    category: "Workspaces",
    location: "Temuco",
    status: "Construido",
    developedBy: "MaríaDesign - Emir Esparza - Josefina Carrasco",
    scope: "Interiorismo, Render",
    description: "Habilitación de oficina gerencial para múltiples usos. Se desarrollaron espacios de trabajo, sala de reuniones con espacio de presentación, recibidor, cafetería y sala de lectura. Diseñado para facilitar el flujo de trabajo con múltiples equipos de personas. Se diseñó mobiliario especializado para los diferentes ambientes y usos, además de un trabajo de especificación de materiales e interiorismo coordinado.",
    cover: "/assets/img/project-details/Oficina GL/Render/ChatGPT Image 20 jul 2026, 02_11_40 a.m..png",
    images: [
      projectImage("Oficina GL", "Render/ChatGPT Image 20 jul 2026, 02_11_40 a.m..png", "Vista general de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-32-53.png", "Área de reunión de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-35-48.png", "Mobiliario integrado y circulación de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-42-23.png", "Puesto de trabajo principal de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-44-50.png", "Filtro de madera y recorrido interior de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-46-40.png", "Mueble longitudinal de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-47-41.png", "Detalle de almacenamiento de OFICINA LE"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-18-06-31.png", "Sala de reunión y apoyo de OFICINA LE")
    ],
    related: ["homeoffice-cg", "cdl", "render-bd"]
  },
  {
    slug: "quincho-ss",
    title: "QUINCHO SS",
    category: "Arquitectura",
    location: "Temuco",
    status: "En construcción",
    developedBy: "Emir Esparza - Karen Moller",
    scope: "Arquitectura, Interiorismo, Render",
    description: "El proyecto se trata de un espacio cerrado e independiente que amplía las posibilidades de uso de la vivienda principal. Incluye comedor, barra y una amplia zona destinada a la cocina. Diseñado para ser utilizado durante todo el año, el proyecto combina materiales de carácter industrial, acentos de color y soluciones de bajo mantenimiento. El resultado es un espacio cómodo y funcional para cocinar, recibir y compartir.",
    cover: "/assets/img/project-details/Quincho SS/Renders/ChatGPT Image 21 jul 2026, 12_02_49 a.m..png",
    images: [
      projectImage("Quincho SS", "Renders/ChatGPT Image 21 jul 2026, 12_02_49 a.m..png", "Parrilla, barra y mobiliario de QUINCHO SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-03-26_archviz_premium.png", "Vista principal del área de preparación de QUINCHO SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-04-28_archviz_premium.png", "Barra y materialidad de QUINCHO SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-05-32_archviz_premium.png", "Comedor y cocina integrados de QUINCHO SS"),
      projectImage("Quincho SS", "Renders/QSS_archviz_premium.png", "Vista longitudinal de QUINCHO SS")
    ],
    related: ["antu", "casa-al", "casa-bv"]
  },
  {
    slug: "laderas-del-sur",
    title: "LADERAS DEL SUR",
    category: "Oficina Técnica Externa",
    location: "Temuco",
    status: "En construcción",
    developedBy: "Natalia Acuña - Emir Esparza",
    client: "Objeto de Diseño - Natalia Acuña ARQ",
    scope: "Arquitectura, Interiorismo, Render",
    description: "Desarrollo de imágenes para presentar espacios comunes e interiores de un proyecto inmobiliario de Pocuro. Se ejecutan piezas para su web, publicidad y salas de venta. El trabajo se realizó en coordinación con las propuestas de arquitectura y el estudio de interiorismo, buscando una representación coherente, atractiva y clara para potenciales compradores.",
    gallerySelection: [1, 4, 6, 11, 12, 15, 17, 18],
    cover: "/assets/img/project-details/Render Pocuro/PNG _ Cowork/CW1.png",
    images: [
      projectImage("Render Pocuro", "PNG _ Cowork/CW1.png", "Vista general del cowork de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW2.png", "Mesas de trabajo del cowork de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW3.png", "Distribución del cowork de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW4.png", "Área flexible del cowork de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Gym/GY1.png", "Área de entrenamiento funcional de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Gym/GY2.png", "Circulación y equipamiento del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY3.png", "Equipamiento principal del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY4.png", "Vista longitudinal del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY5.png", "Zona de máquinas del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY6.png", "Iluminación y materialidad del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY7.png", "Guardado y zona funcional del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC1.png", "Acceso al recibidor de LADERAS DEL SUR"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC2.png", "Área de espera del recibidor"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC3.png", "Mobiliario y revestimientos del recibidor"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC4.png", "Vista complementaria del recibidor"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA1.png", "Sala multiuso y cocina comunitaria"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA2.png", "Área recreativa de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA3.png", "Comedor comunitario de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA4.png", "Estar y cocina de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA5.png", "Isla y equipamiento de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA6.png", "Vista general de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA7.png", "Cocina y estar de LADERAS DEL SUR")
    ],
    related: ["casa-ba", "taller-salfa", "render-bd"]
  },
  {
    slug: "zen416",
    title: "ZEN416",
    category: "Arquitectura",
    location: "Temuco",
    status: "En construcción",
    developedBy: "Emir Esparza - Karen Moller",
    scope: "Arquitectura, Interiorismo, Render",
    description: "Edificio de uso mixto que integra un local comercial en primer nivel y dos departamentos en el segundo. El proyecto se desarrolla en un terreno acotado dentro de un sector de Temuco en proceso de renovación urbana. La propuesta busca aprovechar eficientemente la superficie disponible mediante una arquitectura simple, funcional y fácil de mantener.",
    cover: "/assets/img/project-details/Zenteno/Render/A.png",
    images: [
      projectImage("Zenteno", "Render/A.png", "Vista urbana principal de ZEN416"),
      projectImage("Zenteno", "Render/B.png", "Acceso en esquina de ZEN416"),
      projectImage("Zenteno", "Render/C.png", "Espacio comercial interior de ZEN416"),
      projectImage("Zenteno", "Render/D.png", "Área interior complementaria de ZEN416"),
      projectImage("Zenteno", "Render/E.png", "Volumetría general de ZEN416")
    ],
    related: ["antu", "casa-al", "casa-bv"]
  },
  {
    slug: "oficina-tr",
    title: "OFICINA TR",
    category: "Arquitectura",
    location: "Villarrica",
    status: "Construida",
    developedBy: "Emir Esparza",
    scope: "Arquitectura, Interiorismo, Render",
    description: "Oficina modular transportable para un entorno rural cercano al lago Villarrica. El módulo fue documentado de forma remota para su fabricación en una maestranza local próxima al terreno. Diseñada para un programador que trabaja a distancia y desarrolla fabricación digital 3D, la propuesta combina oficina y taller en un espacio personalizado. Se priorizan la luz natural, la relación con el paisaje y una distribución flexible, capaz de adaptarse al movimiento y renovación de equipos y máquinas.",
    images: [],
    related: ["casa101", "antu", "casa-bv"]
  },
  {
    slug: "casa-ba",
    title: "CASA BA",
    category: "Oficina Técnica Externa",
    location: "Temuco",
    status: "Proyecto",
    developedBy: "Emir Esparza",
    client: "Objeto de Diseño - Natalia Acuña ARQ",
    scope: "Arquitectura, Render, Detallamiento, Oficina Técnica Externa",
    description: "Apoyo especializado para transformar un anteproyecto arquitectónico en un proyecto ejecutivo coordinado, construible y comprensible. Se desarrollaron el modelo BIM, la planimetría, las especificaciones técnicas y el detalle arquitectónico, respetando los lineamientos de diseño de la oficina responsable. El trabajo permitió organizar la información, anticipar decisiones críticas y producir una documentación más clara y consistente para la ejecución de la obra.",
    images: [],
    related: ["taller-salfa", "laderas-del-sur", "antu"]
  },
  {
    slug: "taller-salfa",
    title: "TALLER SALFA",
    category: "Oficina Técnica Externa",
    location: "Temuco",
    status: "Anteproyecto",
    developedBy: "Emir Esparza - Karen Moller",
    client: "Salfa Temuco",
    scope: "Arquitectura, Oficina Técnica Externa",
    description: "Rehabilitación y adecuación de una nave industrial para su reconversión en taller mecánico y de pintura automotriz. El proyecto contempló el diseño de oficinas administrativas, recepción y área de espera para clientes, además del desarrollo arquitectónico, la coordinación técnica y la tramitación integral del área de taller.",
    images: [],
    related: ["casa-ba", "laderas-del-sur", "antu"]
  },
  {
    slug: "casa101",
    title: "CASA101",
    category: "Arquitectura",
    location: "Pucón",
    status: "Proyecto",
    developedBy: "Emir Esparza",
    scope: "Arquitectura, Interiorismo",
    description: "Vivienda rural unifamiliar emplazada en las faldas del volcán Villarrica. Se configura mediante una estructura modular de madera y acero, elevada sobre el terreno para conservar activo el suelo natural. Un patio central organiza las actividades y articula una circulación con abundante luz natural y ventilación cruzada. Sus cuatro accesos permiten usos simultáneos y recorridos independientes, reduciendo interferencias entre los habitantes y manteniendo el patio como espacio común de encuentro.",
    images: [],
    related: ["oficina-tr", "casa-bv", "casa-al"]
  }
];

export const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
