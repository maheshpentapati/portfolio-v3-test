/* =========================================================
   Portfolio v3 — Three.js 3D hero + interactions
   ========================================================= */
(function () {
  'use strict';

  /* -------- Year -------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------- Loader -------- */
  var loader = document.getElementById('loader');
  var loaderText = document.getElementById('loaderText');
  var loaderFill = document.getElementById('loaderFill');
  var loadPct = 0;
  var loadInterval = setInterval(function () {
    loadPct += Math.random() * 18 + 8;
    if (loadPct >= 100) { loadPct = 100; clearInterval(loadInterval); finishLoad(); }
    if (loaderText) loaderText.textContent = String(Math.floor(loadPct)).padStart(2, '0');
    if (loaderFill) loaderFill.style.width = loadPct + '%';
  }, 120);
  function finishLoad() {
    setTimeout(function () {
      if (loader) loader.classList.add('done');
    }, 300);
  }

  /* -------- Three.js 3D scene -------- */
  function initThree() {
    if (typeof THREE === 'undefined') return;
    var canvas = document.getElementById('bg3d');
    if (!canvas) return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 3.5;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Simplex noise GLSL (Ashima)
    var noiseGLSL = [
      'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
      'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
      'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
      'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
      'float snoise(vec3 v){',
      '  const vec2 C=vec2(1.0/6.0,1.0/3.0);',
      '  const vec4 D=vec4(0.0,0.5,1.0,2.0);',
      '  vec3 i=floor(v+dot(v,C.yyy));',
      '  vec3 x0=v-i+dot(i,C.xxx);',
      '  vec3 g=step(x0.yzx,x0.xyz);',
      '  vec3 l=1.0-g;',
      '  vec3 i1=min(g.xyz,l.zxy);',
      '  vec3 i2=max(g.xyz,l.zxy);',
      '  vec3 x1=x0-i1+C.xxx;',
      '  vec3 x2=x0-i2+C.yyy;',
      '  vec3 x3=x0-D.yyy;',
      '  i=mod289(i);',
      '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
      '  float n_=0.142857142857;',
      '  vec3 ns=n_*D.wyz-D.xzx;',
      '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
      '  vec4 x_=floor(j*ns.z);',
      '  vec4 y_=floor(j-7.0*x_);',
      '  vec4 x=x_*ns.x+ns.yyyy;',
      '  vec4 y=y_*ns.x+ns.yyyy;',
      '  vec4 h=1.0-abs(x)-abs(y);',
      '  vec4 b0=vec4(x.xy,y.xy);',
      '  vec4 b1=vec4(x.zw,y.zw);',
      '  vec4 s0=floor(b0)*2.0+1.0;',
      '  vec4 s1=floor(b1)*2.0+1.0;',
      '  vec4 sh=-step(h,vec4(0.0));',
      '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;',
      '  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
      '  vec3 p0=vec3(a0.xy,h.x);',
      '  vec3 p1=vec3(a0.zw,h.y);',
      '  vec3 p2=vec3(a1.xy,h.z);',
      '  vec3 p3=vec3(a1.zw,h.w);',
      '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
      '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
      '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);',
      '  m=m*m;',
      '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
      '}'
    ].join('\n');

    var vertexShader = noiseGLSL + [
      'uniform float uTime;',
      'uniform float uIntensity;',
      'varying vec3 vNormal;',
      'varying vec3 vPosition;',
      'varying float vNoise;',
      'void main(){',
      '  float n = snoise(position * 1.2 + vec3(uTime * 0.25));',
      '  float n2 = snoise(position * 2.4 + vec3(uTime * 0.4));',
      '  float displacement = n * 0.25 + n2 * 0.08;',
      '  vec3 newPos = position + normal * displacement * uIntensity;',
      '  vNormal = normalize(normalMatrix * normal);',
      '  vPosition = newPos;',
      '  vNoise = displacement;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);',
      '}'
    ].join('\n');

    var fragmentShader = [
      'uniform float uTime;',
      'uniform vec3 uColorA;',
      'uniform vec3 uColorB;',
      'uniform vec3 uColorC;',
      'varying vec3 vNormal;',
      'varying vec3 vPosition;',
      'varying float vNoise;',
      'void main(){',
      '  vec3 viewDir = normalize(-vPosition);',
      '  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);',
      '  float t = smoothstep(-0.3, 0.3, vNoise);',
      '  vec3 baseColor = mix(uColorA, uColorB, t);',
      '  vec3 color = mix(baseColor, uColorC, fresnel);',
      '  color += fresnel * 0.6;',
      '  gl_FragColor = vec4(color, 0.92);',
      '}'
    ].join('\n');

    var uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColorA: { value: new THREE.Color(0x0a0f1a) },
      uColorB: { value: new THREE.Color(0x66f5d5) },
      uColorC: { value: new THREE.Color(0xa78bfa) }
    };

    var geometry = new THREE.IcosahedronGeometry(1.2, 48);
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Wireframe overlay
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0x66f5d5,
      wireframe: true,
      transparent: true,
      opacity: 0.06
    });
    var wireGeo = new THREE.IcosahedronGeometry(1.3, 4);
    var wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // Particle field
    var particleCount = 1400;
    var particleGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      var r = 2 + Math.random() * 8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particleMat = new THREE.PointsMaterial({
      color: 0x66f5d5,
      size: 0.015,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse
    var mouseX = 0, mouseY = 0, tmx = 0, tmy = 0;
    document.addEventListener('mousemove', function (e) {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll influence
    var scrollY = 0;
    window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

    // Resize
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    var clock = new THREE.Clock();

    function animate() {
      var t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      // Smooth mouse follow
      mouseX += (tmx - mouseX) * 0.05;
      mouseY += (tmy - mouseY) * 0.05;

      mesh.rotation.y = t * 0.15 + mouseX * 0.5;
      mesh.rotation.x = mouseY * 0.4;
      wireMesh.rotation.y = -t * 0.08 - mouseX * 0.3;
      wireMesh.rotation.x = -mouseY * 0.25;

      // Scroll response — mesh scales and fades
      var sc = Math.max(0.2, 1 - scrollY / 800);
      mesh.scale.setScalar(sc);
      wireMesh.scale.setScalar(sc);

      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.015;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }

  if (typeof THREE !== 'undefined') {
    initThree();
  } else {
    window.addEventListener('load', initThree);
  }

  /* -------- Custom cursor -------- */
  var cursor = document.getElementById('cursor');
  var cursorDot = document.getElementById('cursorDot');
  if (cursor && cursorDot && window.matchMedia('(hover: hover)').matches) {
    var cx = 0, cy = 0, ctx = 0, cty = 0;
    var dx = 0, dy = 0;
    document.addEventListener('mousemove', function (e) {
      ctx = e.clientX; cty = e.clientY;
      dx = e.clientX; dy = e.clientY;
    });
    (function cursorLoop() {
      cx += (ctx - cx) * 0.18;
      cy += (cty - cy) * 0.18;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      cursorDot.style.left = dx + 'px';
      cursorDot.style.top = dy + 'px';
      requestAnimationFrame(cursorLoop);
    })();
    var hoverables = document.querySelectorAll('a, button, .work-row, .exp-row, .fact, .skills-inline li');
    hoverables.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hover'); });
    });
  }

  /* -------- Scroll progress + header -------- */
  var progress = document.getElementById('scrollProgress');
  var header = document.getElementById('siteHeader');
  function onScroll() {
    var s = window.scrollY;
    var h = document.body.scrollHeight - window.innerHeight;
    var pct = h > 0 ? (s / h) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (header) header.classList.toggle('is-scrolled', s > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------- Mobile menu -------- */
  var menuBtn = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* -------- Scroll reveal -------- */
  var revealables = document.querySelectorAll('[data-reveal], .underline-swipe');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* -------- Active nav link on scroll -------- */
  var sections = [].slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = [].slice.call(document.querySelectorAll('.primary-nav a'));
  var linkById = {};
  navLinks.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    if (id) linkById[id] = a;
  });
  if (sections.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkById[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navIO.observe(s); });
  }

})();
