/* LSPedia — identidad institucional y SEO semántico adicional. */
(function(){
  'use strict';

  const TITULO='Diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)';
  const DESCRIPCION='LSPedia es un diccionario visual gratuito de español que ayuda a comprender palabras y conceptos con apoyo de imágenes y videos en Lengua de Señas Peruana (LSP).';

  function definirH1(){
    const h1=document.getElementById('tituloPrincipal');
    if(!h1)return;
    const actual=String(h1.textContent||'').replace(/\s+/g,' ').trim();
    if(actual===TITULO)return;

    h1.textContent='';
    const destacado=document.createElement('span');
    destacado.className='titulo-acento';
    destacado.textContent='Diccionario visual';
    h1.append(destacado,document.createTextNode(' de español con apoyo en Lengua de Señas Peruana (LSP)'));
  }

  function agregarWebApplication(){
    if(document.getElementById('lspediaJsonLdWebApp'))return;
    const script=document.createElement('script');
    script.id='lspediaJsonLdWebApp';
    script.type='application/ld+json';
    script.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@type':'WebApplication',
      name:'LSPedia',
      url:'https://lspedia.site/',
      description:DESCRIPCION,
      applicationCategory:'EducationalApplication',
      operatingSystem:'Any',
      isAccessibleForFree:true,
      inLanguage:'es-PE',
      browserRequirements:'Requires a modern web browser',
      author:{
        '@type':'Person',
        name:'Nilton F. G.'
      }
    });
    document.head.appendChild(script);
  }

  function reforzarMeta(){
    let creator=document.querySelector('meta[name="creator"]');
    if(!creator){
      creator=document.createElement('meta');
      creator.name='creator';
      document.head.appendChild(creator);
    }
    creator.content='Nilton F. G.';
  }

  function iniciar(){
    definirH1();
    agregarWebApplication();
    reforzarMeta();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
