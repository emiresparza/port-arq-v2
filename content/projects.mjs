const projectImage = (folder, file, alt) => [
  `/assets/img/project-details/${folder}/${file}`,
  alt
];

export const projects = [
  {
    slug: "antu",
    title: "Antü",
    category: "Arquitectura",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Arquitectura, interiorismo y coordinación de especialidades",
    description: "Proyecto institucional desarrollado como una propuesta integral, donde arquitectura, uso e identidad se resuelven mediante un mismo sistema de decisiones.",
    problem: "Ordenar requerimientos diversos dentro de una solución espacial clara, capaz de sostener el funcionamiento cotidiano y una identidad reconocible.",
    decision: "Concentrar la propuesta en una secuencia legible de espacios, una materialidad contenida y relaciones directas entre programa, circulación y luz.",
    development: "El proyecto avanzó desde criterios de implantación y programa hacia definición material, visualización y coordinación técnica, reduciendo ambigüedades antes de construir.",
    narrativeTitles: {
      problem: "Un programa diverso bajo una identidad común.",
      decision: "Secuencias claras y materialidad contenida.",
      development: "Coordinar antes de construir."
    },
    cover: "/assets/img/project-details/antu/img-0.webp",
    images: [
      projectImage("antu", "img-0.webp", "Vista general del proyecto institucional Antü"),
      projectImage("antu", "img-1.webp", "Espacio interior y materialidad del proyecto Antü"),
      projectImage("antu", "img-2.webp", "Detalle de arquitectura interior del proyecto Antü"),
      projectImage("antu", "img-3.webp", "Relación entre iluminación y superficies en Antü"),
      projectImage("antu", "img-4.webp", "Vista complementaria de los espacios de Antü")
    ],
    related: ["casa-alicia", "casa-bv", "zenteno"]
  },
  {
    slug: "big-dreams",
    title: "Big Dreams",
    category: "Interiorismo",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Interiorismo, distribución, mobiliario y visualización",
    description: "Espacio infantil concebido como una secuencia continua de recepción, encuentro, aprendizaje y juego, con una identidad amable y reconocible.",
    problem: "Integrar actividades de distinta escala y nivel de concentración dentro de un espacio unitario, manteniendo visibilidad, orientación y seguridad.",
    decision: "Organizar el programa mediante límites curvos, mobiliario integrado y variaciones controladas de color que distinguen usos sin fragmentar el conjunto.",
    development: "La propuesta se comprobó mediante visualizaciones coordinadas de recepción, áreas flexibles, sala multiuso y zonas de juego.",
    narrativeTitles: {
      problem: "Aprender y jugar sin fragmentar el espacio.",
      decision: "Curvas que orientan y conectan.",
      development: "Validar cada uso mediante la imagen."
    },
    cover: "/assets/img/project-details/Big Dreams/Renders/A.png",
    images: [
      projectImage("Big Dreams", "Renders/A.png", "Recepción y acceso principal de Big Dreams"),
      projectImage("Big Dreams", "Renders/B.png", "Área flexible de encuentro y aprendizaje en Big Dreams"),
      projectImage("Big Dreams", "Renders/C(3).png", "Sala multiuso y proyección del proyecto Big Dreams"),
      projectImage("Big Dreams", "Renders/D.png", "Zona de juego integrada al espacio infantil Big Dreams")
    ],
    related: ["quincho-ss", "oficina-gl", "cdl"]
  },
  {
    slug: "casa-alicia",
    title: "Casa Alicia",
    category: "Arquitectura",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Arquitectura residencial, interiorismo y visualización",
    description: "Vivienda de desarrollo horizontal que se inserta entre la vegetación y articula sus espacios interiores con terrazas, corredores y vistas largas hacia el terreno.",
    problem: "Implantar una vivienda en un entorno arbolado, resguardando la escala doméstica y manteniendo una relación directa con el paisaje.",
    decision: "Disponer volúmenes bajos y cubiertas inclinadas alrededor de transiciones protegidas que prolongan el uso interior hacia el exterior.",
    development: "La visualización permitió revisar implantación, accesos, proporciones, materialidad y continuidad entre las áreas comunes y las terrazas.",
    narrativeTitles: {
      problem: "Habitar un claro entre árboles.",
      decision: "Volúmenes bajos que prolongan el paisaje.",
      development: "Comprobar la casa desde dentro y fuera."
    },
    cover: "/assets/img/project-details/Casa Alicia/Renders/A.png",
    images: [
      projectImage("Casa Alicia", "Renders/A.png", "Vista exterior principal de Casa Alicia"),
      projectImage("Casa Alicia", "Renders/B.png", "Volúmenes y acceso de Casa Alicia"),
      projectImage("Casa Alicia", "Renders/C.png", "Acceso cubierto y materialidad de Casa Alicia"),
      projectImage("Casa Alicia", "Renders/D.png", "Relación entre los volúmenes de Casa Alicia"),
      projectImage("Casa Alicia", "Renders/E.png", "Implantación de Casa Alicia en el paisaje"),
      projectImage("Casa Alicia", "Renders/F.png", "Cocina y espacio común de Casa Alicia"),
      projectImage("Casa Alicia", "Renders/G.png", "Terraza protegida y conexión interior exterior de Casa Alicia")
    ],
    related: ["casa-bv", "casa-cg", "antu"]
  },
  {
    slug: "casa-bv",
    title: "Casa BV",
    category: "Arquitectura",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Arquitectura residencial, interiorismo y desarrollo técnico",
    description: "Vivienda proyectada desde la relación entre programa doméstico, orientación y continuidad entre los espacios interiores y el terreno.",
    problem: "Convertir un programa residencial diverso en una organización simple, con jerarquías claras y una experiencia cotidiana coherente.",
    decision: "Definir una estructura espacial continua que agrupa servicios, libera las áreas comunes y controla las aperturas según uso, privacidad y asoleamiento.",
    development: "La propuesta se coordinó mediante modelación y visualización para comprobar proporciones, encuentros y decisiones de materialidad antes de su documentación.",
    narrativeTitles: {
      problem: "Ordenar la vida doméstica sin perder continuidad.",
      decision: "Una envolvente precisa abierta al paisaje.",
      development: "Proporciones y encuentros comprobados en modelo."
    },
    cover: "/assets/img/project-details/Casa BV/ChatGPT Image 27 may 2026, 11_34_37 p.m..png",
    images: [
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_37 p.m..png", "Vista exterior principal de Casa BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_30 p.m..png", "Acceso y fachada de Casa BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_27 p.m..png", "Volumen posterior y materialidad de Casa BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_35_24 p.m..png", "Fachada longitudinal y terraza de Casa BV"),
      projectImage("Casa BV", "ChatGPT Image 27 may 2026, 11_34_21 p.m..png", "Espacio interior y vistas al paisaje de Casa BV")
    ],
    related: ["casa-alicia", "casa-cg", "antu"]
  },
  {
    slug: "casa-cg",
    title: "Casa CG",
    category: "Arquitectura",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Arquitectura residencial, visualización y documentación",
    description: "Proyecto residencial que organiza el habitar mediante volúmenes precisos, transiciones protegidas y una relación controlada con el exterior.",
    problem: "Dar respuesta a privacidad, iluminación y funcionamiento doméstico sin fragmentar el proyecto en recintos aislados.",
    decision: "Trabajar el volumen y sus vacíos como una sola operación, graduando las aperturas y articulando las áreas comunes alrededor de relaciones visuales largas.",
    development: "El modelo digital permitió estudiar envolvente, luz y materialidad, y convertir esas decisiones en documentación consistente para las siguientes etapas.",
    narrativeTitles: {
      problem: "Privacidad y luz dentro de una planta continua.",
      decision: "Vacíos y aperturas como una sola operación.",
      development: "Del modelo a una documentación consistente."
    },
    cover: "/assets/img/project-details/casa-cg/img-0.jpg",
    images: [
      projectImage("casa-cg", "img-0.jpg", "Vista exterior de Casa CG"),
      projectImage("casa-cg", "img-1.jpg", "Acceso y composición volumétrica de Casa CG"),
      projectImage("casa-cg", "img-2.jpg", "Espacio interior de la vivienda Casa CG"),
      projectImage("casa-cg", "img-3.jpg", "Relación interior exterior en Casa CG"),
      projectImage("casa-cg", "img-4.jpg", "Detalle de materialidad del proyecto Casa CG")
    ],
    related: ["casa-bv", "casa-alicia", "homeoffice-cg"]
  },
  {
    slug: "cdl",
    title: "CdL",
    category: "Interiorismo",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Interiorismo comercial, exhibición, mobiliario y visualización",
    description: "Proyecto comercial que integra exhibición, atención y almacenamiento dentro de una atmósfera cálida vinculada a la identidad de sus productos.",
    problem: "Ordenar una alta densidad de productos y recorridos de clientes sin perder visibilidad, orientación ni carácter de marca.",
    decision: "Construir un sistema continuo de estanterías, mesones y elementos suspendidos que organiza la exhibición y libera las circulaciones principales.",
    development: "Las visualizaciones permitieron revisar capacidad, iluminación, relaciones entre mobiliario y experiencia del cliente antes de la ejecución.",
    narrativeTitles: {
      problem: "Exhibir más sin saturar el recorrido.",
      decision: "Mobiliario continuo como sistema espacial.",
      development: "Capacidad e iluminación verificadas antes de obra."
    },
    cover: "/assets/img/project-details/CdL/Render/Enscape_2024-08-16-17-14-16.png",
    images: [
      projectImage("CdL", "Render/Enscape_2024-08-16-17-14-16.png", "Vista general del espacio comercial CdL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-14-51.png", "Área de atención y exhibición del proyecto CdL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-19-01.png", "Mobiliario y recorridos interiores de CdL"),
      projectImage("CdL", "Render/Enscape_2024-08-16-17-22-46.png", "Detalle de estanterías y mesón del proyecto CdL")
    ],
    related: ["big-dreams", "oficina-gl", "quincho-ss"]
  },
  {
    slug: "homeoffice-cg",
    title: "Homeoffice CG",
    category: "Interiorismo",
    location: "Chile",
    year: "",
    status: "Construido",
    surface: "",
    scope: "Interiorismo residencial, mobiliario a medida y habilitación",
    description: "Transformación de un recinto bajo cubierta en un espacio de trabajo compacto, incorporando almacenamiento, superficies continuas y luz integrada.",
    problem: "Aprovechar una geometría inclinada y una superficie acotada para alojar dos puestos de trabajo, guardado y apoyo cotidiano.",
    decision: "Utilizar mobiliario perimetral a medida para absorber la pendiente, mantener libre el centro del recinto y unificar las distintas funciones.",
    development: "El proyecto se verificó mediante visualizaciones y se documentó posteriormente con fotografías de la habilitación terminada.",
    narrativeTitles: {
      problem: "Trabajar bajo una geometría inclinada.",
      decision: "El perímetro se convierte en infraestructura.",
      development: "De la visualización al espacio construido."
    },
    cover: "/assets/img/project-details/Homeoffice CG/Renders/A3.png",
    images: [
      projectImage("Homeoffice CG", "Renders/A3.png", "Vista general del homeoffice CG"),
      projectImage("Homeoffice CG", "Renders/A4.png", "Puestos de trabajo y almacenamiento del homeoffice CG"),
      projectImage("Homeoffice CG", "Renders/A1.png", "Mobiliario integrado del homeoffice CG"),
      projectImage("Homeoffice CG", "Renders/A2.png", "Acceso y volumen de guardado del homeoffice CG"),
      projectImage("Homeoffice CG", "Fotos Terminado/A.jpeg", "Acceso al homeoffice CG construido"),
      projectImage("Homeoffice CG", "Fotos Terminado/B.jpeg", "Superficie de trabajo bajo cubierta"),
      projectImage("Homeoffice CG", "Fotos Terminado/C.jpeg", "Encuentro del escritorio y el mobiliario"),
      projectImage("Homeoffice CG", "Fotos Terminado/D.jpeg", "Iluminación integrada del homeoffice CG"),
      projectImage("Homeoffice CG", "Fotos Terminado/E.jpeg", "Revestimiento y luz del espacio terminado"),
      projectImage("Homeoffice CG", "Fotos Terminado/F.jpeg", "Detalle del puesto de trabajo construido"),
      projectImage("Homeoffice CG", "Fotos Terminado/G.jpeg", "Mueble de guardado y acceso del homeoffice CG")
    ],
    related: ["oficina-gl", "quincho-ss", "casa-cg"]
  },
  {
    slug: "oficina-gl",
    title: "Oficina GL",
    category: "Interiorismo",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Interiorismo corporativo, mobiliario a medida y visualización",
    description: "Oficina privada organizada mediante mobiliario integrado, filtros de madera y una paleta material sobria que articula trabajo, reunión y guardado.",
    problem: "Compatibilizar puestos de trabajo, reuniones y almacenamiento dentro de una planta compacta y con alta exposición visual.",
    decision: "Usar piezas de mobiliario como infraestructura espacial para jerarquizar recorridos, resguardar sectores y mantener continuidad de luz.",
    development: "La propuesta se desarrolló mediante una serie de visualizaciones para coordinar distribución, iluminación, revestimientos y detalles de mobiliario.",
    narrativeTitles: {
      problem: "Concentrar trabajo, reunión y guardado.",
      decision: "Muebles que ordenan la planta.",
      development: "Coordinar el interior antes de ejecutarlo."
    },
    cover: "/assets/img/project-details/Oficina GL/Render/ChatGPT Image 20 jul 2026, 02_11_40 a.m..png",
    images: [
      projectImage("Oficina GL", "Render/ChatGPT Image 20 jul 2026, 02_11_40 a.m..png", "Vista general de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-32-53.png", "Área de reunión de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-35-48.png", "Mobiliario integrado y circulación de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-42-23.png", "Puesto de trabajo principal de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-44-50.png", "Filtro de madera y recorrido interior de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-46-40.png", "Mueble longitudinal de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-17-47-41.png", "Detalle de almacenamiento de la Oficina GL"),
      projectImage("Oficina GL", "Render/Enscape_2024-05-01-18-06-31.png", "Sala de reunión y apoyo de la Oficina GL")
    ],
    related: ["homeoffice-cg", "cdl", "big-dreams"]
  },
  {
    slug: "quincho-ss",
    title: "Quincho SS",
    category: "Interiorismo",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Remodelación interior, mobiliario a medida y visualización",
    description: "Remodelación de un quincho doméstico que integra preparación, parrilla, bar y comedor mediante una composición continua de mobiliario y superficies.",
    problem: "Reunir actividades de cocina y encuentro en una planta alargada, manteniendo circulaciones claras y capacidad para grupos numerosos.",
    decision: "Concentrar las instalaciones en un frente continuo y utilizar una península como transición entre preparación, barra y comedor.",
    development: "La propuesta se revisó mediante visualizaciones coordinadas de materialidad, iluminación, equipamiento y mobiliario a medida.",
    narrativeTitles: {
      problem: "Cocinar y reunirse en una planta alargada.",
      decision: "Una península articula todos los usos.",
      development: "Materialidad y equipamiento bajo una misma revisión."
    },
    cover: "/assets/img/project-details/Quincho SS/Renders/ChatGPT Image 21 jul 2026, 12_02_49 a.m..png",
    images: [
      projectImage("Quincho SS", "Renders/ChatGPT Image 21 jul 2026, 12_02_49 a.m..png", "Parrilla, barra y mobiliario del Quincho SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-03-26_archviz_premium.png", "Vista principal del área de preparación del Quincho SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-04-28_archviz_premium.png", "Barra y materialidad del Quincho SS"),
      projectImage("Quincho SS", "Renders/Enscape_2026-07-03-13-05-32_archviz_premium.png", "Comedor y cocina integrados del Quincho SS"),
      projectImage("Quincho SS", "Renders/QSS_archviz_premium.png", "Vista longitudinal del Quincho SS")
    ],
    related: ["homeoffice-cg", "oficina-gl", "cdl"]
  },
  {
    slug: "render-pocuro",
    title: "Render Pocuro",
    category: "Visualización",
    location: "Chile",
    year: "",
    status: "Visualización desarrollada",
    surface: "",
    scope: "Visualización arquitectónica de espacios comunes",
    description: "Serie de visualizaciones para comunicar un conjunto de áreas comunes residenciales, incluyendo cowork, gimnasio, recibidor y sala multiuso.",
    problem: "Construir una lectura consistente para recintos con programas y atmósferas diferentes, manteniendo una identidad común en toda la serie.",
    decision: "Definir una base material compartida y ajustar iluminación, encuadres y equipamiento según la actividad específica de cada espacio.",
    development: "La serie se organizó por recintos y puntos de vista complementarios para facilitar la evaluación espacial y la comunicación comercial del proyecto.",
    narrativeTitles: {
      problem: "Cuatro programas, una identidad compartida.",
      decision: "Una base material que admite distintas atmósferas.",
      development: "Series coherentes para evaluar y comunicar."
    },
    gallerySelection: [1, 4, 6, 11, 12, 15, 17, 18],
    cover: "/assets/img/project-details/Render Pocuro/PNG _ Cowork/CW1.png",
    images: [
      projectImage("Render Pocuro", "PNG _ Cowork/CW1.png", "Vista general del cowork de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW2.png", "Mesas de trabajo del cowork de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW3.png", "Distribución del cowork de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Cowork/CW4.png", "Área flexible del cowork de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Gym/GY1.png", "Área de entrenamiento funcional de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Gym/GY2.png", "Circulación y equipamiento del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY3.png", "Equipamiento principal del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY4.png", "Vista longitudinal del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY5.png", "Zona de máquinas del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY6.png", "Iluminación y materialidad del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Gym/GY7.png", "Guardado y zona funcional del gimnasio"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC1.png", "Acceso al recibidor de Render Pocuro"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC2.png", "Área de espera del recibidor"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC3.png", "Mobiliario y revestimientos del recibidor"),
      projectImage("Render Pocuro", "PNG _ Recibidor/REC4.png", "Vista complementaria del recibidor"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA1.png", "Sala multiuso y cocina comunitaria"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA2.png", "Área recreativa de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA3.png", "Comedor comunitario de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA4.png", "Estar y cocina de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA5.png", "Isla y equipamiento de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA6.png", "Vista general de la sala multiuso"),
      projectImage("Render Pocuro", "PNG _ Sala Multiuso/SA7.png", "Cocina y estar de Render Pocuro")
    ],
    related: ["big-dreams", "oficina-gl", "quincho-ss"]
  },
  {
    slug: "zenteno",
    title: "Zenteno",
    category: "Arquitectura",
    location: "Chile",
    year: "",
    status: "Proyecto desarrollado",
    surface: "",
    scope: "Arquitectura, interiorismo comercial y visualización",
    description: "Proyecto de esquina que recupera la continuidad urbana mediante un volumen sobrio, un primer nivel transparente y espacios interiores de uso comercial.",
    problem: "Resolver la presencia de un edificio en esquina y compatibilizar su relación con la calle con un programa interior abierto y flexible.",
    decision: "Consolidar el perímetro con un volumen unitario y activar el nivel de acceso mediante vanos amplios que conectan visualmente interior y espacio público.",
    development: "La propuesta se estudió desde escalas complementarias: inserción urbana, envolvente, acceso, espacios interiores y lectura volumétrica general.",
    narrativeTitles: {
      problem: "Construir presencia urbana en una esquina.",
      decision: "Un volumen unitario con un borde activo.",
      development: "Del encaje urbano a la escala interior."
    },
    cover: "/assets/img/project-details/Zenteno/Render/A.png",
    images: [
      projectImage("Zenteno", "Render/A.png", "Vista urbana principal del proyecto Zenteno"),
      projectImage("Zenteno", "Render/B.png", "Acceso en esquina del proyecto Zenteno"),
      projectImage("Zenteno", "Render/C.png", "Espacio comercial interior de Zenteno"),
      projectImage("Zenteno", "Render/D.png", "Área interior complementaria del proyecto Zenteno"),
      projectImage("Zenteno", "Render/E.png", "Volumetría general del proyecto Zenteno")
    ],
    related: ["casa-alicia", "antu", "cdl"]
  }
];

export const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
