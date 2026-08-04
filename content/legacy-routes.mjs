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
  "casa-cg": "casa-ca",
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
  "rendering-bigdreams": "render-bd",
  "rendering-lds": "laderas-del-sur",
  "taller-salfa": "taller-salfa",
  "tw-temuco": null,
  "videoinstalacion-mnfpn": null,
  "zen426": "zen416"
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
  ["/proyectos/big-dreams/", "/proyectos/render-bd/"],
  ["/proyectos/casa-alicia/", "/proyectos/casa-al/"],
  ["/proyectos/casa-cg/", "/proyectos/casa-ca/"],
  ["/proyectos/oficina-gl/", "/proyectos/oficina-le/"],
  ["/proyectos/render-pocuro/", "/proyectos/laderas-del-sur/"],
  ["/proyectos/zenteno/", "/proyectos/zen416/"],
  ["/proyectos/belmonte/", "/proyectos/"],
  ["/proyectos/bim-panoramica/", "/proyectos/"],
  ["/proyectos/oficinas-cdj-group/", "/proyectos/"],
  ["/proyectos/clinica-o2/", "/proyectos/"],
  ["/proyectos/rendering-lds/", "/proyectos/laderas-del-sur/"],
  ["/proyectos/rendering-bigdreams/", "/proyectos/render-bd/"]
]);

export const legacyProjectTarget = (id) => {
  if (!(id in legacyProjectMap)) return "/proyectos/";
  const slug = legacyProjectMap[id];
  return slug ? `/proyectos/${slug}/` : "/proyectos/";
};
