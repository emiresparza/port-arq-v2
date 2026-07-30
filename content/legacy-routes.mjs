export const legacyProjectMap = {
  "antu": "antu",
  "belmonte": null,
  "bienal-arq-2015": null,
  "bim-panoramica": null,
  "branding-14arq": null,
  "branding-arte-facto": null,
  "branding-aura": null,
  "branding-bosquesur": null,
  "branding-notable": null,
  "campana-estoesatomica": null,
  "casa-baier": null,
  "casa-bv": "casa-bv",
  "casa-cg": "casa-cg",
  "casa-mn": null,
  "casa-ter": null,
  "casa-vm": null,
  "cava-del-lechon": "cdl",
  "cincocasas-llanquihue": null,
  "clinica-o2": null,
  "clinica-pl": null,
  "clinica-ta": null,
  "desarrollo-grafico-caa": null,
  "diseno-material-docente-um": null,
  "ellas-co-portal-frances": null,
  "fragmentos-de-humanidad": null,
  "maqueta-publicaciones-um": null,
  "oficinas-cdj-group": null,
  "oficinas-frindt": null,
  "parque-olimpia": null,
  "rendering-bigdreams": "big-dreams",
  "rendering-lds": null,
  "taller-salfa": null,
  "tw-temuco": null,
  "videoinstalacion-mnfpn": null,
  "zen426": "zenteno"
};

export const legacyStaticRedirects = new Map([
  ["/projects", "/proyectos/"],
  ["/projects.html", "/proyectos/"],
  ["/nosotros", "/estudio/"],
  ["/nosotros.html", "/estudio/"],
  ["/blog", "/"],
  ["/blog.html", "/"],
  ["/post", "/"],
  ["/post.html", "/"],
  ["/proyectos/belmonte/", "/proyectos/"],
  ["/proyectos/bim-panoramica/", "/proyectos/"],
  ["/proyectos/oficinas-cdj-group/", "/proyectos/"],
  ["/proyectos/clinica-o2/", "/proyectos/"],
  ["/proyectos/taller-salfa/", "/proyectos/"],
  ["/proyectos/rendering-lds/", "/proyectos/"],
  ["/proyectos/rendering-bigdreams/", "/proyectos/big-dreams/"]
]);

export const legacyProjectTarget = (id) => {
  if (!(id in legacyProjectMap)) return "/proyectos/";
  const slug = legacyProjectMap[id];
  return slug ? `/proyectos/${slug}/` : "/proyectos/";
};
