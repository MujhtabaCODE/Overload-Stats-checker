  const tabBtnGym = document.getElementById('tabBtnGym');
  const tabBtnHab = document.getElementById('tabBtnHab');
  const tabGym = document.getElementById('tabGym');
  const tabHab = document.getElementById('tabHab');
  tabBtnGym.onclick = () => {
    tabBtnGym.classList.add('active'); tabBtnHab.classList.remove('active');
    tabGym.classList.add('active'); tabHab.classList.remove('active');
  };
  tabBtnHab.onclick = () => {
    tabBtnHab.classList.add('active'); tabBtnGym.classList.remove('active');
    tabHab.classList.add('active'); tabGym.classList.remove('active');
  };

  (function(){
    const exercises = {
      "Lat Pulldown": [], "Barbell Row": [], "Seated Cable Row": [],
      "Bicep Curl (DB)": [], "Hammer Curl": [],
    };
    let current = "Lat Pulldown";

    const exList = document.getElementById('gym-exList');
    const curExName = document.getElementById('gym-curExName');
    const curExMeta = document.getElementById('gym-curExMeta');
    const historyBody = document.getElementById('gym-historyBody');
    const emptyState = document.getElementById('gym-emptyState');
    const totalSetsEl = document.getElementById('gym-totalSets');

    function renderExList(){
      exList.innerHTML = '';
      Object.keys(exercises).forEach(name => {
        const logs = exercises[name];
        const best = logs.reduce((m,l)=>Math.max(m,l.weight), 0);
        const btn = document.createElement('button');
        btn.className = 'ex-btn' + (name===current ? ' active' : '');
        btn.innerHTML = `<span>${name}</span><small>${best ? best+'kg' : '—'}</small>`;
        btn.onclick = () => { current = name; renderAll(); };
        exList.appendChild(btn);
      });
    }

    function renderPanel(){
      const logs = exercises[current];
      curExName.textContent = current;
      curExMeta.textContent = logs.length ? `${logs.length} SESSION${logs.length>1?'S':''} LOGGED` : 'NO DATA YET — LOG YOUR FIRST SET';

      historyBody.innerHTML = '';
      if (logs.length === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        const maxW = Math.max(...logs.map(l=>l.weight));
        logs.slice().reverse().forEach(l => {
          const tr = document.createElement('tr');
          const isPR = l.weight === maxW && l.weight > 0;
          tr.innerHTML = `<td>${l.date}</td><td>${l.weight}kg${isPR ? '<span class="pr-tag">PR</span>' : ''}</td><td>${l.reps}</td><td>${l.sets}</td><td>${(l.weight*l.reps*l.sets).toFixed(0)}kg</td>`;
          historyBody.appendChild(tr);
        });
      }

      drawChart(logs);
      drawBarbell(logs.length ? logs[logs.length-1].weight : 0);
      drawVolumeBars(logs);
      drawLoadPie(logs);
    }

    function drawChart(logs){
      const svg = document.getElementById('gym-chartSvg');
      [...svg.querySelectorAll('.drawn')].forEach(el => el.remove());
      const W=700, H=200, padL=40, padR=20, padT=20, padB=30;
      const plotW=W-padL-padR, plotH=H-padT-padB;

      for (let i=0;i<=3;i++){
        const y = padT + (plotH/3)*i;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',padL); line.setAttribute('x2',W-padR);
        line.setAttribute('y1',y); line.setAttribute('y2',y);
        line.setAttribute('class','grid-line drawn');
        svg.appendChild(line);
      }

      if (logs.length === 0) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x', W/2); txt.setAttribute('y', H/2);
        txt.setAttribute('text-anchor','middle'); txt.setAttribute('class','axis-label drawn');
        txt.textContent = 'Progress chart will appear here';
        svg.appendChild(txt);
        return;
      }

      const maxW = Math.max(...logs.map(l=>l.weight)) * 1.15 || 1;
      const n = logs.length;
      const pts = logs.map((l,i) => {
        const x = n===1 ? padL+plotW/2 : padL + (plotW/(n-1))*i;
        const y = padT+plotH - (l.weight/maxW)*plotH;
        return [x,y,l.weight];
      });

      let areaD = `M ${pts[0][0]} ${padT+plotH} `;
      pts.forEach(p => areaD += `L ${p[0]} ${p[1]} `);
      areaD += `L ${pts[pts.length-1][0]} ${padT+plotH} Z`;
      const area = document.createElementNS('http://www.w3.org/2000/svg','path');
      area.setAttribute('d', areaD); area.setAttribute('fill','url(#gymAreaGrad)');
      area.setAttribute('class','drawn'); area.setAttribute('opacity','0.5');
      svg.appendChild(area);

      let lineD = `M ${pts[0][0]} ${pts[0][1]} `;
      pts.forEach(p => lineD += `L ${p[0]} ${p[1]} `);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', lineD); path.setAttribute('class','chart-path drawn');
      svg.appendChild(path);

      const maxVal = Math.max(...logs.map(l=>l.weight));
      pts.forEach(p => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
        dot.setAttribute('cx',p[0]); dot.setAttribute('cy',p[1]);
        dot.setAttribute('r', p[2]===maxVal ? 6:4);
        dot.setAttribute('class', 'drawn ' + (p[2]===maxVal ? 'chart-dot pr':'chart-dot'));
        svg.appendChild(dot);
      });

      [0, maxW/2, maxW].forEach(v => {
        const y = padT+plotH-(v/maxW)*plotH;
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',padL-8); txt.setAttribute('y',y+4);
        txt.setAttribute('text-anchor','end'); txt.setAttribute('class','axis-label drawn');
        txt.textContent = v.toFixed(0);
        svg.appendChild(txt);
      });
    }

    function drawBarbell(weight){
      const svg = document.getElementById('gym-barbellSvg');
      svg.innerHTML = '';
      const cx=300, cy=45;
      const bar = document.createElementNS('http://www.w3.org/2000/svg','rect');
      bar.setAttribute('x',40); bar.setAttribute('y',cy-4);
      bar.setAttribute('width',520); bar.setAttribute('height',8);
      bar.setAttribute('fill','#8a8378'); bar.setAttribute('rx',2);
      svg.appendChild(bar);

      const plateDefs = [20,15,10,5,2.5];
      const colors = {20:'#e8952e', 15:'#c65b4a', 10:'#6f8a6a', 5:'#6f6a5e', 2.5:'#a89f8f'};
      let remaining = weight/2;
      const plates = [];
      plateDefs.forEach(p => { while (remaining >= p-0.001) { plates.push(p); remaining -= p; } });

      function drawSide(dir){
        let x = dir===1 ? 304 : 296;
        plates.forEach(p => {
          const h = 20 + Math.min(p,20)*1.6;
          const w = 10 + p*0.4;
          if (dir===1) x += w+2; else x -= (w+2);
          const rx = dir===1 ? x-w : x;
          const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('x',rx); rect.setAttribute('y',cy-h/2);
          rect.setAttribute('width',w); rect.setAttribute('height',h);
          rect.setAttribute('rx',3); rect.setAttribute('fill', colors[p]||'#6f6a5e');
          rect.setAttribute('stroke','#171510'); rect.setAttribute('stroke-width','1');
          svg.appendChild(rect);
        });
      }
      drawSide(-1); drawSide(1);

      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x',cx); txt.setAttribute('y',78);
      txt.setAttribute('text-anchor','middle');
      txt.setAttribute('font-family',"'IBM Plex Mono', monospace");
      txt.setAttribute('font-size','13'); txt.setAttribute('fill','#a89f8f');
      txt.textContent = weight > 0 ? `${weight} kg total` : 'Log a set to load the bar';
      svg.appendChild(txt);
    }

    function drawVolumeBars(logs){
      const svg = document.getElementById('gym-barSvg');
      svg.innerHTML = '';
      const W=400, H=160, padL=34, padR=10, padT=10, padB=24;
      const plotW=W-padL-padR, plotH=H-padT-padB;
      const axis = document.createElementNS('http://www.w3.org/2000/svg','line');
      axis.setAttribute('x1',padL); axis.setAttribute('x2',W-padR);
      axis.setAttribute('y1',padT+plotH); axis.setAttribute('y2',padT+plotH);
      axis.setAttribute('class','bar-axis');
      svg.appendChild(axis);

      if (logs.length === 0){
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x', W/2); txt.setAttribute('y', H/2);
        txt.setAttribute('text-anchor','middle'); txt.setAttribute('class','axis-label');
        txt.textContent = 'No sessions yet';
        svg.appendChild(txt);
        return;
      }

      const volumes = logs.map(l => l.weight*l.reps*l.sets);
      const maxV = Math.max(...volumes) * 1.1 || 1;
      const n = logs.length, gap = 6;
      const barW = Math.min(34, (plotW-gap*(n-1))/n);
      const totalW = barW*n + gap*(n-1);
      const startX = padL + (plotW-totalW)/2;

      volumes.forEach((v,i) => {
        const h = (v/maxV)*plotH;
        const x = startX + i*(barW+gap);
        const y = padT+plotH-h;
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x',x); rect.setAttribute('y',y);
        rect.setAttribute('width',barW); rect.setAttribute('height',Math.max(h,2));
        rect.setAttribute('rx',2);
        rect.setAttribute('class','bar-rect' + (i===n-1 ? ' latest':''));
        svg.appendChild(rect);
      });

      [0, maxV/2, maxV].forEach(v => {
        const y = padT+plotH-(v/maxV)*plotH;
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',padL-6); txt.setAttribute('y',y+4);
        txt.setAttribute('text-anchor','end'); txt.setAttribute('class','axis-label');
        txt.textContent = v>=1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0);
        svg.appendChild(txt);
      });
    }

    function drawLoadPie(logs){
      const svg = document.getElementById('gym-pieSvg');
      svg.innerHTML = '';
      const cx=100, cy=72, r=48, sw=16;
      const circumference = 2*Math.PI*r;
      const track = document.createElementNS('http://www.w3.org/2000/svg','circle');
      track.setAttribute('cx',cx); track.setAttribute('cy',cy); track.setAttribute('r',r);
      track.setAttribute('stroke-width',sw); track.setAttribute('class','pie-track');
      svg.appendChild(track);

      if (logs.length < 2){
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',cx); txt.setAttribute('y',cy+4);
        txt.setAttribute('class','axis-label'); txt.setAttribute('text-anchor','middle');
        txt.textContent = logs.length ? 'Log more to compare' : 'No data yet';
        svg.appendChild(txt);
        return;
      }

      const start = logs[0].weight;
      const latest = logs[logs.length-1].weight;
      const gainFrac = start > 0 ? Math.max(0, Math.min(1, (latest-start)/latest)) : 1;
      const pct = start > 0 ? Math.round(((latest-start)/start)*100) : 0;

      const fill = document.createElementNS('http://www.w3.org/2000/svg','circle');
      fill.setAttribute('cx',cx); fill.setAttribute('cy',cy); fill.setAttribute('r',r);
      fill.setAttribute('stroke-width',sw); fill.setAttribute('class','pie-fill');
      fill.setAttribute('stroke-dasharray', `${gainFrac*circumference} ${circumference}`);
      fill.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      svg.appendChild(fill);

      const num = document.createElementNS('http://www.w3.org/2000/svg','text');
      num.setAttribute('x',cx); num.setAttribute('y',cy-2); num.setAttribute('font-size','22');
      num.setAttribute('class','pie-center-num');
      num.textContent = (pct>=0?'+':'')+pct+'%';
      svg.appendChild(num);

      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x',cx); lbl.setAttribute('y',cy+16); lbl.setAttribute('font-size','9');
      lbl.setAttribute('class','pie-center-lbl');
      lbl.textContent = `${start}kg → ${latest}kg`;
      svg.appendChild(lbl);
    }

    function updateTotalSets(){
      let total = 0;
      Object.values(exercises).forEach(logs => logs.forEach(l => total += Number(l.sets)));
      totalSetsEl.textContent = total;
    }

    function renderAll(){ renderExList(); renderPanel(); updateTotalSets(); }

    document.getElementById('gym-logBtn').onclick = () => {
      const weight = parseFloat(document.getElementById('gym-inWeight').value);
      const reps = parseInt(document.getElementById('gym-inReps').value);
      const sets = parseInt(document.getElementById('gym-inSets').value) || 1;
      if (!weight || !reps) { document.getElementById('gym-inWeight').focus(); return; }
      const date = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short'});
      exercises[current].push({date, weight, reps, sets});
      document.getElementById('gym-inWeight').value = '';
      document.getElementById('gym-inReps').value = '';
      document.getElementById('gym-inSets').value = '1';
      renderAll();
    };

    document.getElementById('gym-addExBtn').onclick = () => {
      const input = document.getElementById('gym-newExName');
      const name = input.value.trim();
      if (!name || exercises[name]) return;
      exercises[name] = []; current = name; input.value = '';
      renderAll();
    };
    document.getElementById('gym-newExName').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('gym-addExBtn').click(); });

    renderAll();
  })();

  (function(){
    const habits = {
      "Cold shower": { unit: "", checkins: [], metrics: [] },
      "Read": { unit: "pages", checkins: [], metrics: [] },
      "Stretch / mobility": { unit: "mins", checkins: [], metrics: [] },
    };
    let current = "Cold shower";

    const exList = document.getElementById('hab-exList');
    const curExName = document.getElementById('hab-curExName');
    const curExMeta = document.getElementById('hab-curExMeta');
    const todayBtn = document.getElementById('hab-todayBtn');
    const historyBody = document.getElementById('hab-historyBody');
    const emptyState = document.getElementById('hab-emptyState');
    const totalCheckinsEl = document.getElementById('hab-totalCheckins');
    const metricSection = document.getElementById('hab-metricSection');
    const noMetricNote = document.getElementById('hab-noMetricNote');

    function todayStr(){ return dateStr(new Date()); }
    function dateStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function fmtDate(iso){ const d = new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-GB', {day:'2-digit', month:'short'}); }

    function computeStreaks(checkins){
      const set = new Set(checkins);
      let cur = 0, d = new Date();
      while (set.has(dateStr(d))) { cur++; d.setDate(d.getDate()-1); }
      const sorted = [...set].sort();
      let best = 0, run = 0, prev = null;
      sorted.forEach(ds => {
        if (prev) {
          const prevD = new Date(prev+'T00:00:00'), curD = new Date(ds+'T00:00:00');
          const diff = Math.round((curD-prevD)/86400000);
          run = diff === 1 ? run+1 : 1;
        } else { run = 1; }
        best = Math.max(best, run); prev = ds;
      });
      return { cur, best: Math.max(best,cur) };
    }

    function rateLast30(checkins){
      const set = new Set(checkins);
      let count = 0, d = new Date();
      for (let i=0;i<30;i++){ if (set.has(dateStr(d))) count++; d.setDate(d.getDate()-1); }
      return Math.round((count/30)*100);
    }

    function renderExList(){
      exList.innerHTML = '';
      Object.keys(habits).forEach(name => {
        const h = habits[name];
        const { cur } = computeStreaks(h.checkins);
        const btn = document.createElement('button');
        btn.className = 'ex-btn' + (name===current ? ' active' : '');
        btn.innerHTML = `<span>${name}</span><small>${cur > 0 ? '<span class="flame">*</span>'+cur+'d' : '—'}</small>`;
        btn.onclick = () => { current = name; renderAll(); };
        exList.appendChild(btn);
      });
    }

    function renderPanel(){
      const h = habits[current];
      curExName.textContent = current;
      curExMeta.textContent = h.checkins.length ? `${h.checkins.length} DAY${h.checkins.length>1?'S':''} LOGGED` : 'NO DATA YET';

      const done = h.checkins.includes(todayStr());
      todayBtn.textContent = done ? 'DONE TODAY ✓' : 'MARK TODAY DONE';
      todayBtn.className = 'today-btn' + (done ? ' done' : '');

      const { cur, best } = computeStreaks(h.checkins);
      document.getElementById('hab-curStreak').textContent = cur;
      document.getElementById('hab-bestStreak').textContent = best;
      document.getElementById('hab-rate30').textContent = rateLast30(h.checkins) + '%';

      drawHeatmap(h.checkins);

      if (h.unit) {
        metricSection.style.display = 'block';
        noMetricNote.style.display = 'none';
        document.getElementById('hab-metricInputLabel').textContent = `Value (${h.unit})`;
        document.getElementById('hab-metricColHead').textContent = h.unit.charAt(0).toUpperCase()+h.unit.slice(1);
        renderMetricHistory(h.metrics);
        drawChart(h.metrics);
        drawValueBars(h.metrics);
        drawLoadPie(h.metrics);
      } else {
        metricSection.style.display = 'none';
        noMetricNote.style.display = 'block';
      }
    }

    function renderMetricHistory(metrics){
      historyBody.innerHTML = '';
      if (metrics.length === 0) {
        emptyState.style.display = 'block';
        emptyState.textContent = 'No values logged yet — enter a number above and hit LOG.';
      } else {
        emptyState.style.display = 'none';
        const maxV = Math.max(...metrics.map(m=>m.value));
        metrics.slice().reverse().forEach(m => {
          const tr = document.createElement('tr');
          const isBest = m.value === maxV;
          tr.innerHTML = `<td>${fmtDate(m.date)}</td><td>${m.value}${isBest ? '<span class="best-tag">BEST</span>' : ''}</td>`;
          historyBody.appendChild(tr);
        });
      }
    }

    function drawHeatmap(checkins){
      const svg = document.getElementById('hab-heatmapSvg');
      svg.innerHTML = '';
      const set = new Set(checkins);
      const cell = 12, gap = 3, weeks = 13;
      const originX = 26, originY = 4;

      const dayLabels = ['','M','','W','','F',''];
      dayLabels.forEach((lbl,row) => {
        if (!lbl) return;
        const t = document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('x',14); t.setAttribute('y', originY+row*(cell+gap)+cell-2);
        t.setAttribute('class','day-label'); t.textContent = lbl;
        svg.appendChild(t);
      });

      const today = new Date();
      const todayDow = (today.getDay()+6)%7;
      const totalDays = weeks*7;
      const start = new Date(today);
      start.setDate(start.getDate() - (totalDays - 1 - (6-todayDow)));

      for (let i=0;i<totalDays;i++){
        const d = new Date(start); d.setDate(start.getDate()+i);
        if (d > today) break;
        const col = Math.floor(i/7), row = (d.getDay()+6)%7;
        const ds = dateStr(d);
        const isToday = ds === todayStr();
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', originX+col*(cell+gap));
        rect.setAttribute('y', originY+row*(cell+gap));
        rect.setAttribute('width',cell); rect.setAttribute('height',cell); rect.setAttribute('rx',2);
        rect.setAttribute('fill', set.has(ds) ? '#e8952e' : '#332f27');
        if (isToday) { rect.setAttribute('stroke','#ede6d8'); rect.setAttribute('stroke-width','1'); }
        svg.appendChild(rect);
      }
    }

    function drawChart(metrics){
      const svg = document.getElementById('hab-chartSvg');
      [...svg.querySelectorAll('.drawn')].forEach(el => el.remove());
      const W=700, H=180, padL=40, padR=20, padT=16, padB=26;
      const plotW=W-padL-padR, plotH=H-padT-padB;

      for (let i=0;i<=3;i++){
        const y = padT + (plotH/3)*i;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',padL); line.setAttribute('x2',W-padR);
        line.setAttribute('y1',y); line.setAttribute('y2',y);
        line.setAttribute('class','grid-line drawn');
        svg.appendChild(line);
      }

      if (metrics.length === 0) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x', W/2); txt.setAttribute('y', H/2);
        txt.setAttribute('text-anchor','middle'); txt.setAttribute('class','axis-label drawn');
        txt.textContent = 'Progress chart will appear here';
        svg.appendChild(txt);
        return;
      }

      const maxV = Math.max(...metrics.map(m=>m.value)) * 1.15 || 1;
      const n = metrics.length;
      const pts = metrics.map((m,i) => {
        const x = n===1 ? padL+plotW/2 : padL + (plotW/(n-1))*i;
        const y = padT+plotH - (m.value/maxV)*plotH;
        return [x,y,m.value];
      });

      let areaD = `M ${pts[0][0]} ${padT+plotH} `;
      pts.forEach(p => areaD += `L ${p[0]} ${p[1]} `);
      areaD += `L ${pts[pts.length-1][0]} ${padT+plotH} Z`;
      const area = document.createElementNS('http://www.w3.org/2000/svg','path');
      area.setAttribute('d', areaD); area.setAttribute('fill','url(#habAreaGrad)');
      area.setAttribute('class','drawn'); area.setAttribute('opacity','0.5');
      svg.appendChild(area);

      let lineD = `M ${pts[0][0]} ${pts[0][1]} `;
      pts.forEach(p => lineD += `L ${p[0]} ${p[1]} `);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', lineD); path.setAttribute('class','chart-path drawn');
      svg.appendChild(path);

      const maxVal = Math.max(...metrics.map(m=>m.value));
      pts.forEach(p => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
        dot.setAttribute('cx',p[0]); dot.setAttribute('cy',p[1]);
        dot.setAttribute('r', p[2]===maxVal ? 6:4);
        dot.setAttribute('class','drawn ' + (p[2]===maxVal ? 'chart-dot best':'chart-dot'));
        svg.appendChild(dot);
      });

      [0, maxV/2, maxV].forEach(v => {
        const y = padT+plotH-(v/maxV)*plotH;
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',padL-8); txt.setAttribute('y',y+4);
        txt.setAttribute('text-anchor','end'); txt.setAttribute('class','axis-label drawn');
        txt.textContent = v.toFixed(1).replace(/\.0$/,'');
        svg.appendChild(txt);
      });
    }

    function drawValueBars(metrics){
      const svg = document.getElementById('hab-barSvg');
      svg.innerHTML = '';
      const W=400, H=160, padL=34, padR=10, padT=10, padB=24;
      const plotW=W-padL-padR, plotH=H-padT-padB;
      const axis = document.createElementNS('http://www.w3.org/2000/svg','line');
      axis.setAttribute('x1',padL); axis.setAttribute('x2',W-padR);
      axis.setAttribute('y1',padT+plotH); axis.setAttribute('y2',padT+plotH);
      axis.setAttribute('class','bar-axis');
      svg.appendChild(axis);

      if (metrics.length === 0){
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x', W/2); txt.setAttribute('y', H/2);
        txt.setAttribute('text-anchor','middle'); txt.setAttribute('class','axis-label');
        txt.textContent = 'No sessions yet';
        svg.appendChild(txt);
        return;
      }

      const values = metrics.map(m => m.value);
      const maxV = Math.max(...values) * 1.1 || 1;
      const n = values.length, gap = 6;
      const barW = Math.min(34, (plotW-gap*(n-1))/n);
      const totalW = barW*n + gap*(n-1);
      const startX = padL + (plotW-totalW)/2;

      values.forEach((v,i) => {
        const h = (v/maxV)*plotH;
        const x = startX + i*(barW+gap);
        const y = padT+plotH-h;
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x',x); rect.setAttribute('y',y);
        rect.setAttribute('width',barW); rect.setAttribute('height',Math.max(h,2));
        rect.setAttribute('rx',2);
        rect.setAttribute('class','bar-rect' + (i===n-1 ? ' latest':''));
        svg.appendChild(rect);
      });

      [0, maxV/2, maxV].forEach(v => {
        const y = padT+plotH-(v/maxV)*plotH;
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',padL-6); txt.setAttribute('y',y+4);
        txt.setAttribute('text-anchor','end'); txt.setAttribute('class','axis-label');
        txt.textContent = v>=1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(1).replace(/\.0$/,'');
        svg.appendChild(txt);
      });
    }

    function drawLoadPie(metrics){
      const svg = document.getElementById('hab-pieSvg');
      svg.innerHTML = '';
      const cx=100, cy=72, r=48, sw=16;
      const circumference = 2*Math.PI*r;
      const track = document.createElementNS('http://www.w3.org/2000/svg','circle');
      track.setAttribute('cx',cx); track.setAttribute('cy',cy); track.setAttribute('r',r);
      track.setAttribute('stroke-width',sw); track.setAttribute('class','pie-track');
      svg.appendChild(track);

      if (metrics.length < 2){
        const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
        txt.setAttribute('x',cx); txt.setAttribute('y',cy+4);
        txt.setAttribute('class','axis-label'); txt.setAttribute('text-anchor','middle');
        txt.textContent = metrics.length ? 'Log more to compare' : 'No data yet';
        svg.appendChild(txt);
        return;
      }

      const start = metrics[0].value;
      const latest = metrics[metrics.length-1].value;
      const gainFrac = start > 0 ? Math.max(0, Math.min(1, (latest-start)/latest)) : 1;
      const pct = start > 0 ? Math.round(((latest-start)/start)*100) : 0;

      const fill = document.createElementNS('http://www.w3.org/2000/svg','circle');
      fill.setAttribute('cx',cx); fill.setAttribute('cy',cy); fill.setAttribute('r',r);
      fill.setAttribute('stroke-width',sw); fill.setAttribute('class','pie-fill');
      fill.setAttribute('stroke-dasharray', `${gainFrac*circumference} ${circumference}`);
      fill.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      svg.appendChild(fill);

      const num = document.createElementNS('http://www.w3.org/2000/svg','text');
      num.setAttribute('x',cx); num.setAttribute('y',cy-2); num.setAttribute('font-size','22');
      num.setAttribute('class','pie-center-num');
      num.textContent = (pct>=0?'+':'')+pct+'%';
      svg.appendChild(num);

      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x',cx); lbl.setAttribute('y',cy+16); lbl.setAttribute('font-size','9');
      lbl.setAttribute('class','pie-center-lbl');
      lbl.textContent = `${start} → ${latest}`;
      svg.appendChild(lbl);
    }

    function updateTotalCheckins(){
      let total = 0;
      Object.values(habits).forEach(h => total += h.checkins.length);
      totalCheckinsEl.textContent = total;
    }

    function renderAll(){ renderExList(); renderPanel(); updateTotalCheckins(); }

    todayBtn.onclick = () => {
      const h = habits[current];
      const ds = todayStr();
      const idx = h.checkins.indexOf(ds);
      if (idx === -1) h.checkins.push(ds); else h.checkins.splice(idx,1);
      renderAll();
    };

    document.getElementById('hab-logMetricBtn').onclick = () => {
      const val = parseFloat(document.getElementById('hab-inMetric').value);
      if (isNaN(val)) { document.getElementById('hab-inMetric').focus(); return; }
      habits[current].metrics.push({ date: todayStr(), value: val });
      if (!habits[current].checkins.includes(todayStr())) habits[current].checkins.push(todayStr());
      document.getElementById('hab-inMetric').value = '';
      renderAll();
    };

    document.getElementById('hab-addExBtn').onclick = () => {
      const nameInput = document.getElementById('hab-newExName');
      const unitInput = document.getElementById('hab-newExUnit');
      const name = nameInput.value.trim();
      const unit = unitInput.value.trim();
      if (!name || habits[name]) return;
      habits[name] = { unit, checkins: [], metrics: [] };
      current = name; nameInput.value = ''; unitInput.value = '';
      renderAll();
    };
    document.getElementById('hab-newExName').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('hab-addExBtn').click(); });
    document.getElementById('hab-newExUnit').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('hab-addExBtn').click(); });

    document.getElementById('hab-exportBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(habits, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'overload-consistency-' + todayStr() + '.json';
      a.click(); URL.revokeObjectURL(url);
    };
    document.getElementById('hab-importBtn').onclick = () => document.getElementById('hab-fileImport').click();
    document.getElementById('hab-fileImport').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          Object.keys(habits).forEach(k => delete habits[k]);
          Object.assign(habits, data);
          current = Object.keys(habits)[0] || current;
          renderAll();
        } catch (err) {
          alert('Could not read that file — make sure it is a JSON export from this tracker.');
        }
      };
      reader.readAsText(file);
    });

    renderAll();
  })();
