// Versões "sonho" dos dois portais: sem o limite de 3 m do manual, para sonhar primeiro e regular depois.
// Uso: const d = Sonho.build('salto' | 'omega', ctx) → { group, tick(now), setNight(on), segs, specs }
// ctx: { THREE, BRAND, bambooMat, escTex, flagTex, nameTex, units: [{ name, color }] }
(function () {
  'use strict';

  function build(kind, ctx) {
    const { THREE, BRAND } = ctx;
    const v = (x, y, z) => new THREE.Vector3(x, y, z), Yax = v(0, 1, 0);
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o));
    const root = new THREE.Group();
    const bom = { pieces: [], joints: 0, galoes: 0, ledM: 0, tecidoM2: 0, placas: 0 };
    const segs = [];
    const gold = mat(BRAND.ouro, { roughness: 0.45 }), blue = mat(BRAND.leal, { roughness: 0.55 });
    const galaoGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.46, 16);
    const galaoMat = mat(0x3b82c4, { transparent: true, opacity: 0.85, roughness: 0.3 });
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ledLines = [], hoopLeds = [];

    function rod(parent, a, b, r, m, cls, label, col) {
      const len = a.distanceTo(b); if (len < 0.01) return;
      const geo = new THREE.CylinderGeometry(r, r, len, 8, 1), mesh = new THREE.Mesh(geo, m);
      mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(Yax, b.clone().sub(a).normalize());
      mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
      if (m === ctx.bambooMat) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len / 0.4); }
      if (cls) bom.pieces.push({ cls, len: Math.round(len * 100) / 100, label });
      segs.push({ parent, a: a.clone(), b: b.clone(), col, w: r });
    }
    function galao(parent, x, z) { const m = new THREE.Mesh(galaoGeo, galaoMat); m.position.set(x, 0.23, z); m.castShadow = true; parent.add(m); bom.galoes++; }
    function ledLoop(parent, pts, hoop) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts), m = new THREE.LineBasicMaterial({ color: 0xffd36a });
      const line = new THREE.LineLoop(geo, m); parent.add(line); ledLines.push(line); if (hoop) hoopLeds.push(m);
      for (let i = 0; i < pts.length; i++) bom.ledM += pts[i].distanceTo(pts[(i + 1) % pts.length]);
    }
    const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
    function windowPath(g, x, y, w, h) { g.beginPath(); g.moveTo(x - w / 2, y + h); g.lineTo(x - w / 2, y + w / 2); g.arc(x, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, y + h); g.closePath(); }
    function plaqueTex(u) {
      return canvasTex(256, 368, (c, w, h) => {
        windowPath(c, w / 2, 4, w - 12, h - 10); c.fillStyle = BRAND.leal; c.fill(); c.lineWidth = 12; c.strokeStyle = u.color === BRAND.leal ? BRAND.claro : u.color; c.stroke();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; const words = u.name.toUpperCase().split(' ');
        c.font = '400 ' + (words.some(s => s.length > 7) ? 40 : 48) + 'px "Fugaz One", Impact'; words.forEach((wd, i) => c.fillText(wd, w / 2, h * 0.6 - (words.length - 1) * 24 + i * 48));
      });
    }
    const plaqueMats = (ctx.units || []).map(u => mat(0xffffff, { map: plaqueTex(u), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    function plaque(parent, i, pos, rotY, s) {
      if (!plaqueMats[i]) return;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46 * s, 0.66 * s), plaqueMats[i]); m.position.copy(pos); m.rotation.y = rotY; m.castShadow = true; parent.add(m); bom.placas++;
    }
    function disc(parent, pos, r, rotY) {
      const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rotY; parent.add(g);
      const f = new THREE.Mesh(new THREE.CircleGeometry(r, 64), mat(0xffffff, { map: ctx.escTex })); f.position.z = 0.012; f.castShadow = true; g.add(f);
      const b = new THREE.Mesh(new THREE.CircleGeometry(r, 64), blue); b.rotation.y = Math.PI; g.add(b);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 64), gold); rim.position.z = 0.006; g.add(rim);
      return g;
    }

    // ---------- o jaguar de costelas (corpo ao longo de +X, cabeça em +X) ----------
    let skinMat = null, eyeMat = null, inner = null;
    function jaguar(parent, s) {
      const J = new THREE.Group(); J.scale.setScalar(1); parent.add(J);
      const body = t => ({ X: -4.4 + 8.3 * t, yc: 3.05 + 0.95 * t + 0.25 * Math.sin(Math.PI * t), ry: 0.45 + 0.35 * Math.sin(Math.PI * (0.15 + 0.75 * t)) });
      const ST = [];
      for (let i = 0; i <= 22; i++) { const b = body(i / 22); ST.push([b.X, b.yc, b.ry, 0.15 + 0.75 * b.ry]); }
      ST.push([4.25, 4.35, 0.42, 0.4], [4.6, 4.62, 0.46, 0.42], [4.95, 4.68, 0.4, 0.37], [5.25, 4.52, 0.25, 0.24]);
      const S = ST.map(([X, y, ry, rz]) => [X * s, y * s, ry * s, rz * s]);
      const N = 12, ring = ([X, yc, ry, rz], j, add = 0) => { const a = 2 * Math.PI * j / N; return v(X, yc + (ry + add) * Math.cos(a), (rz + add) * Math.sin(a)); };
      // arcos dourados (bambu rachado e envergado) e costelas azuis
      S.forEach((st, i) => {
        for (let j = 0; j < N; j++) rod(J, ring(st, j), ring(st, j + 1), 0.022, gold, 'r', 'Arco do corpo (bambu rachado)', BRAND.ouro);
        bom.joints += N / 2;
        const pts = []; for (let j = 0; j < 24; j++) { const a = 2 * Math.PI * j / 24; pts.push(v(st[0], st[1] + (st[2] + 0.03) * Math.cos(a), (st[3] + 0.03) * Math.sin(a))); }
        ledLoop(J, pts, true);
      });
      for (let i = 0; i < S.length - 1; i++) for (let j = 0; j < N; j += 2) { rod(J, ring(S[i], j), ring(S[i + 1], j), 0.02, blue, 'f', 'Costela (ao longo do corpo)', BRAND.leal); bom.joints++; }
      // pele de tecido translúcido: de dia some no céu, de noite vira lanterna
      const M = 28, pos = [], idx = [];
      S.forEach(([X, yc, ry, rz]) => { for (let k = 0; k <= M; k++) { const a = 2 * Math.PI * k / M; pos.push(X, yc + ry * Math.cos(a), rz * Math.sin(a)); } });
      for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < M; k++) { const a = i * (M + 1) + k, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      for (let i = 0; i < S.length - 1; i++) { const p = Math.PI * (3 * (S[i][2] + S[i][3]) - Math.sqrt((3 * S[i][2] + S[i][3]) * (S[i][2] + 3 * S[i][3]))); bom.tecidoM2 += p * (S[i + 1][0] - S[i][0]); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
      skinMat = new THREE.MeshStandardMaterial({ color: BRAND.ouro, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, roughness: 0.9, emissive: 0x000000 });
      J.add(new THREE.Mesh(sg, skinMat));
      // cabeça: orelhas, olhos e focinho
      [-1, 1].forEach(z => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15 * s, 0.4 * s, 4), gold); ear.position.set(4.5 * s, 5.2 * s, z * 0.25 * s); ear.rotation.z = -0.25; ear.castShadow = true; J.add(ear);
      });
      eyeMat = mat(BRAND.claro, { emissive: 0x000000 });
      [-1, 1].forEach(z => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 16, 12), eyeMat); e.position.set(5.0 * s, 4.82 * s, z * 0.3 * s); J.add(e); });
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065 * s, 12, 10), mat(BRAND.verm)); nose.position.set(5.48 * s, 4.55 * s, 0); J.add(nose);
      // pernas: feixes de 3 bambus grossos, pés em bombonas
      const P = (X, y, z) => v(X * s, y * s, z * s);
      const leg = (pts, z) => {
        for (let i = 0; i < pts.length - 1; i++) [[0, 0.05], [0.045, -0.03], [-0.045, -0.03]].forEach(([dx, dz]) => rod(J, P(pts[i][0] + dx, pts[i][1], z + dz), P(pts[i + 1][0] + dx, pts[i + 1][1], z + dz), 0.045, ctx.bambooMat, 'g', 'Perna (feixe de 3)', '#a9853f'));
        bom.joints += 3 * pts.length;
        const f = pts[pts.length - 1]; [[-0.2, 0], [0.2, 0], [0, 0.28 * Math.sign(z)]].forEach(([dx, dz]) => galao(J, (f[0] + dx) * s, (z + dz) * s));
      };
      [-0.45, 0.45].forEach(z => {
        leg([[3.3, 3.55], [4.25, 2.0], [4.95, 0.02]], z);
        leg([[-3.7, 2.75], [-2.9, 1.45], [-4.0, 0.7], [-4.45, 0.02]], z);
      });
      // rabo que sobe e vira mastro da bandeira do clube
      const tail = [[-4.4, 3.05], [-4.95, 3.3], [-5.3, 3.85], [-5.35, 4.5], [-5.15, 5.05], [-4.85, 5.35]].map(([X, y]) => P(X, y, 0));
      for (let i = 0; i < tail.length - 1; i++) rod(J, tail[i], tail[i + 1], 0.07 * s * (1 - i * 0.12), gold, 'g', 'Rabo', BRAND.ouro);
      const tip = tail[tail.length - 1]; rod(J, tip, tip.clone().setY(tip.y + 1.0 * s), 0.02, ctx.bambooMat, 'f', 'Mastro no rabo', '#a9853f');
      if (ctx.flagTex) { const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 0.6 * s), mat(0xffffff, { map: ctx.flagTex, side: THREE.DoubleSide, roughness: 0.9 })); fl.position.set(tip.x + 0.47 * s, tip.y + 0.68 * s, 0); fl.castShadow = true; J.add(fl); }
      // pintas = placas das 10 unidades, dos dois lados do corpo
      for (let i = 0; i < 10; i++) {
        const t = 0.14 + 0.72 * (i % 5) / 4, b = body(t), a = i < 5 ? 1.25 : 2.0, rz = 0.15 + 0.75 * b.ry;
        [-1, 1].forEach(sd => plaque(J, i, P(b.X, b.yc + b.ry * Math.cos(a), sd * (rz * Math.sin(a) + 0.04)), sd > 0 ? 0 : Math.PI, s));
      }
      // escudo de medalha no ombro e placa JAGUAR pendurada na barriga
      const sh = body(0.86);
      [-1, 1].forEach(sd => disc(J, P(sh.X, sh.yc - 0.05, sd * (0.15 + 0.75 * sh.ry + 0.07)), 0.55 * s, sd > 0 ? 0 : Math.PI));
      if (ctx.nameTex) { const mid = body(0.5), nb = new THREE.Mesh(new THREE.PlaneGeometry(2.4 * s, 0.34 * s), mat(0xffffff, { map: ctx.nameTex, side: THREE.DoubleSide })); nb.position.set(0, (mid.yc - mid.ry - 0.32) * s, 0); nb.castShadow = true; J.add(nb); [-1, 1].forEach(x => rod(J, P(x, mid.yc - mid.ry - 0.15, 0), P(x, mid.yc - mid.ry + 0.02, 0), 0.005, mat(0xcbb48a), null, null, '#8a6a3a')); }
      inner = new THREE.PointLight(0xffc35a, 0, 12 * s); inner.position.set(0, 3.6 * s, 0); J.add(inner);
      return { J, belly: (body(0.5).yc - body(0.5).ry) * s };
    }

    // ---------- o Ômega ----------
    function omega(parent) {
      const R = 2.9, cy = 3.65, Zf = 0.3;
      const ringPts = [];
      for (let d = -140; d <= 140; d += 10) { const t = d * Math.PI / 180; ringPts.push([R * Math.sin(t), cy + R * Math.cos(t)]); }
      const footR = [[2.05, 0.8], [2.45, 0.3], [3.3, 0.02]], footL = footR.map(([x, y]) => [-x, y]).reverse();
      const line = [...footL, ...ringPts, ...footR];
      [-Zf, Zf].forEach(z => {
        for (let i = 0; i < line.length - 1; i++) rod(parent, v(line[i][0], line[i][1], z), v(line[i + 1][0], line[i + 1][1], z), 0.05, blue, 'g', 'Ômega · banzo', BRAND.leal);
        ledLoop(parent, line.map(([x, y]) => v(x, y, z * 1.12)), false);
      });
      line.forEach(([x, y], i) => {
        rod(parent, v(x, y, -Zf), v(x, y, Zf), 0.026, ctx.bambooMat, 'f', 'Ômega · travessa', '#a9853f');
        if (i < line.length - 1) { const [x2, y2] = line[i + 1]; rod(parent, v(x, y, i % 2 ? -Zf : Zf), v(x2, y2, i % 2 ? Zf : -Zf), 0.022, ctx.bambooMat, 'f', 'Ômega · diagonal', '#a9853f'); }
        bom.joints += 3;
      });
      [-3.3, 3.3].forEach(x => {
        rod(parent, v(x, 0.05, -1.1), v(x, 0.05, 1.1), 0.05, ctx.bambooMat, 'g', 'Ômega · base do pé', '#a9853f');
        [[-0.25, -0.8], [0.25, -0.8], [-0.25, 0.8], [0.25, 0.8]].forEach(([dx, dz]) => galao(parent, x + dx, dz));
        [-1, 1].forEach(sd => rod(parent, v(x * 0.8, 1.4, sd * Zf), v(x, 0.05, sd * 1.1), 0.045, ctx.bambooMat, 'g', 'Ômega · escora do pé', '#a9853f'));
      });
      // escudo como pedra de fecho, no alto do anel
      disc(parent, v(0, cy + R + 0.5, -Zf - 0.08), 0.75, Math.PI);
      rod(parent, v(0, cy + R, 0), v(0, cy + R + 0.4, 0), 0.04, ctx.bambooMat, 'g', 'Ômega · suporte do escudo', '#a9853f');
      // 10 pintas em volta do anel, viradas para a rua
      [-124, -100, -76, -52, -28, 28, 52, 76, 100, 124].forEach((d, i) => { const t = d * Math.PI / 180; plaque(parent, i, v(R * Math.sin(t), cy + R * Math.cos(t) - 0.33, -Zf - 0.07), Math.PI, 1); });
      return { R, cy };
    }

    let pathLen = 0, belly = 0, ringInfo = null;
    if (kind === 'salto') { const j = jaguar(root, 1); belly = j.belly; }
    else {
      ringInfo = omega(root);
      const holder = new THREE.Group(); holder.rotation.y = Math.PI / 2; holder.position.z = 0.8; root.add(holder);
      const j = jaguar(holder, 0.85); belly = j.belly;
    }

    // coordenadas de todos os segmentos no referencial do grupo raiz (para a elevação)
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    segs.forEach(sg => { const m = new THREE.Matrix4().multiplyMatrices(inv, sg.parent.matrixWorld); sg.a.applyMatrix4(m); sg.b.applyMatrix4(m); delete sg.parent; });
    const box = new THREE.Box3().setFromObject(root);
    const sum = a => a.reduce((t, p) => t + p.len, 0);
    const specs = {
      altura: box.max.y, largura: box.max.x - box.min.x, profundidade: box.max.z - box.min.z, vao: belly,
      pecas: bom.pieces.length, metros: sum(bom.pieces), metrosG: sum(bom.pieces.filter(p => p.cls === 'g')), metrosR: sum(bom.pieces.filter(p => p.cls === 'r')),
      amarras: bom.joints, galoes: bom.galoes, ledM: bom.ledM, tecidoM2: bom.tecidoM2, placas: bom.placas
    };

    let night = false;
    ledLines.forEach(l => { l.visible = false; });
    function setNight(on) {
      night = on; ledLines.forEach(l => l.visible = on);
      if (skinMat) { skinMat.emissive.set(on ? 0xffa21a : 0x000000); skinMat.emissiveIntensity = on ? 0.55 : 0; skinMat.opacity = on ? 0.32 : 0.2; }
      if (eyeMat) { eyeMat.emissive.set(on ? 0x31b5ff : 0x000000); eyeMat.emissiveIntensity = on ? 2 : 0; }
      if (inner) inner.intensity = on ? 2.2 : 0;
    }
    const dim = new THREE.Color(0x7a4a00), bright = new THREE.Color(0xfff2b0);
    function tick(now) {
      if (!night || !root.visible || reduce) return;
      const n = hoopLeds.length;
      hoopLeds.forEach((m, i) => { const ph = ((now / 1000) * 0.9 - i / n) % 1, b = Math.pow(Math.max(0, Math.cos(((ph + 1) % 1) * Math.PI * 2)), 6); m.color.copy(dim).lerp(bright, 0.35 + 0.65 * b); });
    }
    return { group: root, tick, setNight, segs, specs, ring: ringInfo };
  }

  // Elevação em SVG: proj(p) → [horizontal, altura]
  function elevation(d, proj, opt = {}) {
    const lines = d.segs.map(s => { const [h1, y1] = proj(s.a), [h2, y2] = proj(s.b); return { h1, y1, h2, y2, col: s.col, w: s.w }; });
    let hmin = Infinity, hmax = -Infinity, ymax = 0;
    lines.forEach(l => { hmin = Math.min(hmin, l.h1, l.h2); hmax = Math.max(hmax, l.h1, l.h2); ymax = Math.max(ymax, l.y1, l.y2); });
    hmin -= 1.2; hmax += 0.6; const top = Math.ceil(ymax + 0.6), kk = 52;
    const Wd = (hmax - hmin) * kk, Hd = (top + 0.7) * kk, X = h => +((h - hmin) * kk).toFixed(1), Yp = y => +((top - y) * kk).toFixed(1);
    let s = `<svg viewBox="0 0 ${Wd.toFixed(0)} ${Hd.toFixed(0)}" role="img" aria-label="${opt.label || 'Elevação do portal sonho'}" font-family="Lexend, sans-serif"><rect width="100%" height="100%" fill="var(--panel)"/>`;
    for (let y = 1; y < top; y++) s += `<line x1="0" y1="${Yp(y)}" x2="${Wd}" y2="${Yp(y)}" stroke="var(--line)" stroke-width="1"/><text x="6" y="${Yp(y) - 4}" font-size="11" fill="var(--muted)">${y} m</text>`;
    s += `<line x1="0" y1="${Yp(3)}" x2="${Wd}" y2="${Yp(3)}" stroke="#D61F2C" stroke-width="2" stroke-dasharray="8 5"/><text x="${Wd - 8}" y="${Yp(3) - 6}" text-anchor="end" fill="#D61F2C" font-size="13" font-weight="600">limite do manual 3,00 m</text>`;
    lines.sort((a, b) => a.w - b.w).forEach(l => s += `<line x1="${X(l.h1)}" y1="${Yp(l.y1)}" x2="${X(l.h2)}" y2="${Yp(l.y2)}" stroke="${l.col}" stroke-width="${Math.max(1.2, l.w * kk * 1.1).toFixed(1)}" stroke-linecap="round" stroke-opacity=".85"/>`);
    // pessoa de 1,70 m para escala
    const px = X(hmin + 0.6), py = Yp(0);
    s += `<g fill="var(--fg)"><circle cx="${px}" cy="${py - 1.58 * kk}" r="${0.12 * kk}"/><rect x="${px - 0.13 * kk}" y="${py - 1.45 * kk}" width="${0.26 * kk}" height="${0.7 * kk}" rx="${0.08 * kk}"/><rect x="${px - 0.12 * kk}" y="${py - 0.8 * kk}" width="${0.1 * kk}" height="${0.8 * kk}"/><rect x="${px + 0.02 * kk}" y="${py - 0.8 * kk}" width="${0.1 * kk}" height="${0.8 * kk}"/></g><text x="${px}" y="${py + 16}" font-size="11" text-anchor="middle" fill="var(--muted)">1,70 m</text>`;
    s += `<line x1="0" y1="${Yp(0)}" x2="${Wd}" y2="${Yp(0)}" stroke="var(--fg)" stroke-width="2"/>`;
    const hx = X(hmax - 0.25); s += `<line x1="${hx}" y1="${Yp(0)}" x2="${hx}" y2="${Yp(ymax)}" stroke="var(--fg)"/><text transform="translate(${hx - 6} ${Yp(ymax / 2)}) rotate(-90)" font-size="13" text-anchor="middle" fill="var(--fg)" font-weight="600">${ymax.toFixed(2).replace('.', ',')} m</text>`;
    return s + '</svg>';
  }

  window.Sonho = { build, elevation };
})();
