/* ---------- Data layer (replace with API calls to your backend) ---------- */
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)};
const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const pct=n=>(n*100).toFixed(0)+"%";
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ROOMS=[{id:"STD",name:"Standard",total:40,base:4200,min:3200,max:6500},
 {id:"DLX",name:"Deluxe",total:30,base:6200,min:4800,max:9500},
 {id:"STE",name:"Suite",total:10,base:11000,min:8500,max:17000}];
const CHANNELS=["Direct website","Booking.com","MakeMyTrip","Corporate","Walk-in"];
const COMMISSION={"Direct website":0,"Booking.com":.15,"MakeMyTrip":.17,"Corporate":.05,"Walk-in":0};
const EVENTS=[{d:iso(add(TODAY,9)),name:"Tech summit",boost:.25},{d:iso(add(TODAY,10)),name:"Tech summit",boost:.25},{d:iso(add(TODAY,17)),name:"Wedding weekend",boost:.2}];
const COMPS=[{n:"Harbour Grand",f:1.08},{n:"City Palms",f:.94},{n:"Lotus Residency",f:1.0}];
const NAMES=["Aarav Shah","Meera Nair","John Mathew","Sana Khan","Rohan Das","Priya Iyer","Liam Carter","Ananya Rao","Vikram Singh","Emma Clark","Kabir Mehta","Isha Verma"];
let bookings=[];
for(let i=0;i<150;i++){const t=ROOMS[Math.floor(rnd()*3)];const off=Math.floor(rnd()*70)-32;
 bookings.push({id:1000+i,guest:NAMES[Math.floor(rnd()*NAMES.length)],type:t.id,in:iso(add(TODAY,off)),n:1+Math.floor(rnd()*4),
 ch:CHANNELS[Math.floor(rnd()*5)],rate:Math.round(t.base*(0.88+rnd()*.3)/50)*50,status:rnd()<.08?"Cancelled":"Confirmed"});}
const out=b=>iso(add(new Date(b.in+"T00:00"),b.n));
let applied={};   // "TYPE|date" -> rate
let rules={weekend:10,high:15,lastmin:10,comp:30};
const room=id=>ROOMS.find(r=>r.id===id);

/* ---------- Revenue logic ---------- */
const live=()=>bookings.filter(b=>b.status!=="Cancelled");
function sold(date,type){return live().filter(b=>(!type||b.type===type)&&b.in<=date&&date<out(b)).length}
function soldRev(date,type){return live().filter(b=>(!type||b.type===type)&&b.in<=date&&date<out(b)).reduce((s,b)=>s+b.rate,0)}
const cap=type=>type?room(type).total:ROOMS.reduce((s,r)=>s+r.total,0);
function forecastOcc(date,type){const days=Math.round((new Date(date+"T00:00")-TODAY)/864e5);const o=sold(date,type)/cap(type);
 if(days<=0)return o;return Math.min(1,o+(1-o)*Math.max(0,.6-days*.014)*(.8+.4*Math.abs(Math.sin(days))))}
function compRate(c,type,date){const d=new Date(date+"T00:00");const w=[0,5,6].includes(d.getDay())?1.08:1;return Math.round(room(type).base*c.f*w*(0.97+.06*Math.abs(Math.sin(d.getDate()+c.f*9)))/50)*50}
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function marketAvg(type,date){return COMPS.length?COMPS.reduce((s,c)=>s+compRate(c,type,date),0)/COMPS.length:room(type).base}
function suggest(type,date){const r=room(type),d=new Date(date+"T00:00"),days=Math.round((d-TODAY)/864e5),fo=forecastOcc(date,type),why=[];let m=0;
 if(fo>=.9){m+=.35;why.push("Near sell-out")}else if(fo>=.8){m+=.2;why.push("High demand")}else if(fo>=.6){m+=rules.high/100;why.push("Healthy demand")}else if(fo<.4){m-=.1;why.push("Low demand")}
 if([5,6].includes(d.getDay())){m+=rules.weekend/100;why.push("Weekend")}
 const ev=EVENTS.find(e=>e.d===date);if(ev){m+=ev.boost;why.push(ev.name)}
 if(days<=2&&fo<.5){m-=rules.lastmin/100;why.push("Last-minute fill")}
 let p=r.base*(1+m);const avg=marketAvg(type,date);
 p=p*(1-rules.comp/100)+avg*(rules.comp/100);
 return{rate:Math.min(r.max,Math.max(r.min,Math.round(p/50)*50)),fo,why,avg}}
const cur=(type,date)=>applied[type+"|"+date]||room(type).base;
function kpis(from,to){let s=0,rev=0,av=0;for(let d=from;d<=to;d=add(d,1)){const k=iso(d);s+=sold(k);rev+=soldRev(k);av+=cap()}
 return{occ:s/av,adr:s?rev/s:0,revpar:rev/av,rev,sold:s}}

/* ---------- Tiny SVG charts ---------- */
function lines(series,labels,h=220){const w=640,p=34,max=Math.max(...series.flatMap(s=>s.data))*1.1||1,min=0;
 const x=i=>p+i*(w-p-8)/(labels.length-1),y=v=>h-24-(v-min)/(max-min)*(h-40);
 let g=[0,.5,1].map(t=>`<line x1="${p}" x2="${w-8}" y1="${y(max*t/1.1)}" y2="${y(max*t/1.1)}" stroke="var(--line)"/><text x="2" y="${y(max*t/1.1)+4}">${series[0].fmt(max*t/1.1)}</text>`).join("");
 g+=labels.map((l,i)=>i%Math.ceil(labels.length/7)===0?`<text x="${x(i)}" y="${h-6}" text-anchor="middle">${l}</text>`:"").join("");
 series.forEach(s=>{g+=`<polyline fill="none" stroke="${s.c}" stroke-width="2.2" ${s.dash?'stroke-dasharray="5 4"':""} points="${s.data.map((v,i)=>x(i)+","+y(v)).join(" ")}"/>`});
 return`<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Line chart">${g}</svg>`+`<div class="legend">${series.map(s=>`<span><b style="color:${s.c}">━</b> ${s.name}</span>`).join("")}</div>`}
function bars(vals,labels,h=220){const w=640,p=40,max=Math.max(...vals)*1.1||1,bw=(w-p-8)/vals.length;
 let g=[0,.5,1].map(t=>`<line x1="${p}" x2="${w-8}" y1="${h-24-t*(h-40)}" y2="${h-24-t*(h-40)}" stroke="var(--line)"/><text x="2" y="${h-20-t*(h-40)}">${inr(max*t/1.1/1000)}k</text>`).join("");
 vals.forEach((v,i)=>{const bh=v/max*(h-40);g+=`<rect x="${p+i*bw+3}" y="${h-24-bh}" width="${bw-6}" height="${bh}" rx="3" fill="var(--teal)"><title>${labels[i]}: ${inr(v)}</title></rect><text x="${p+i*bw+bw/2}" y="${h-6}" text-anchor="middle">${labels[i]}</text>`});
 return`<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Bar chart">${g}</svg>`}
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.className="show";setTimeout(()=>t.className="",2200)}
function csv(name,rows){const b=new Blob([rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv"});
 const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();toast("Downloaded "+name)}

/* ---------- Views ---------- */
const VIEWS={
dashboard(){const t=kpis(add(TODAY,-30),add(TODAY,-1)),p=kpis(add(TODAY,-60),add(TODAY,-31));
 const dl=(a,b)=>{const c=(a-b)/(b||1);return`<span class="${c>=0?"up":"dn"}">${c>=0?"▲":"▼"} ${Math.abs(c*100).toFixed(1)}% vs previous 30 days</span>`};
 const labels=[],occ=[],bk=[];for(let i=-14;i<=14;i++){const d=add(TODAY,i),k=iso(d);labels.push(d.getDate()+"/"+(d.getMonth()+1));occ.push(i<=0?sold(k)/cap()*100:forecastOcc(k)*100)}
 const wk=[],wl=[];for(let w=3;w>=0;w--){let r=0;for(let i=0;i<7;i++)r+=soldRev(iso(add(TODAY,-w*7-i-1)));wk.push(r);wl.push("Wk -"+w)}
 const ch=CHANNELS.map(c=>({c,rev:live().filter(b=>b.ch===c&&b.in<=iso(TODAY)).reduce((s,b)=>s+b.rate*b.n,0)})),tot=ch.reduce((s,x)=>s+x.rev,0);
 const todayIn=live().filter(b=>b.in===iso(TODAY)).length,todayOut=live().filter(b=>out(b)===iso(TODAY)).length;
 return`<header class="top"><div><h1>Dashboard</h1><p>Last 30 days · ${todayIn} arrivals and ${todayOut} departures today · ${sold(iso(TODAY))} of ${cap()} rooms occupied</p></div></header>
 <div class="grid k4">
 <div class="card kpi"><div class="l">Occupancy</div><div class="v">${pct(t.occ)}</div>${dl(t.occ,p.occ)}</div>
 <div class="card kpi"><div class="l">ADR (avg daily rate)</div><div class="v">${inr(t.adr)}</div>${dl(t.adr,p.adr)}</div>
 <div class="card kpi"><div class="l">RevPAR</div><div class="v">${inr(t.revpar)}</div>${dl(t.revpar,p.revpar)}</div>
 <div class="card kpi"><div class="l">Room revenue</div><div class="v">${inr(t.rev)}</div>${dl(t.rev,p.rev)}</div></div>
 <div class="grid c2" style="margin-top:14px"><div class="card"><h3>Occupancy %: actual and forecast (±14 days)</h3>${lines([{name:"Occupancy %",data:occ,c:"var(--brass)",fmt:v=>v.toFixed(0)+"%"}],labels)}</div>
 <div class="card"><h3>Revenue by channel</h3>${ch.map(x=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span>${x.c}</span><span>${inr(x.rev)} · ${pct(x.rev/(tot||1))}</span></div><div style="height:6px;background:var(--bg);border-radius:3px"><div style="height:6px;border-radius:3px;background:var(--brass);width:${x.rev/(tot||1)*100}%"></div></div><small style="color:var(--mute)">Commission cost ${inr(x.rev*COMMISSION[x.c])}</small></div>`).join("")}</div></div>
 <div class="card" style="margin-top:14px"><h3>Weekly room revenue</h3>${bars(wk,wl)}</div>`},

bookings(){const q=(VIEWS._q||""),st=(VIEWS._st||"All");
 const rows=bookings.filter(b=>(st==="All"||b.status===st)&&(b.guest+b.id+b.ch).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.in.localeCompare(a.in)).slice(0,40);
 return`<header class="top"><div><h1>Bookings</h1><p>${bookings.length} reservations · showing latest ${rows.length}</p></div><button id="newb">New booking</button></header>
 <div class="bar"><input id="q" placeholder="Search guest, ID or channel" value="${q}" aria-label="Search bookings"><select id="st" aria-label="Status"><option>All</option><option>Confirmed</option><option>Cancelled</option></select><button class="alt" id="expb">Export CSV</button></div>
 <div class="card scroll"><table><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Nights</th><th>Channel</th><th>Rate</th><th>Total</th><th>Status</th><th></th></tr>
 ${rows.map(b=>`<tr><td>#${b.id}</td><td>${esc(b.guest)}</td><td>${room(b.type).name}</td><td>${b.in}</td><td>${b.n}</td><td>${b.ch}</td><td>${inr(b.rate)}</td><td>${inr(b.rate*b.n)}</td><td><span class="tag ${b.status==="Confirmed"?"ok":"bad"}">${b.status}</span></td><td>${b.status==="Confirmed"?`<button class="alt sm" data-cancel="${b.id}">Cancel</button>`:""}</td></tr>`).join("")||"<tr><td colspan=10>No bookings match. Clear the search or add a booking.</td></tr>"}</table></div>`},

rooms(){return`<header class="top"><div><h1>Rooms and rates</h1><p>Inventory today and the rate limits pricing must respect</p></div></header>
 <div class="card scroll"><table><tr><th>Room type</th><th>Rooms</th><th>Sold today</th><th>Occupancy</th><th>Base rate</th><th>Floor</th><th>Ceiling</th><th>Edit base rate</th></tr>
 ${ROOMS.map(r=>{const s=sold(iso(TODAY),r.id);return`<tr><td>${r.name}</td><td>${r.total}</td><td>${s}</td><td>${pct(s/r.total)}</td><td>${inr(r.base)}</td><td>${inr(r.min)}</td><td>${inr(r.max)}</td><td><input type="number" step="50" value="${r.base}" data-base="${r.id}" style="width:100px" aria-label="Base rate ${r.name}"></td></tr>`}).join("")}</table></div>
 <div class="card" style="margin-top:14px"><h3>Events that lift demand</h3>${EVENTS.map(e=>`<span class="tag" style="margin-right:6px">${e.d} · ${e.name} · +${e.boost*100}%</span>`).join("")}</div>`},

pricing(){const tp=VIEWS._pt||"STD",r=room(tp);const days=Array.from({length:14},(_,i)=>{const d=add(TODAY,i+1),k=iso(d);return{d,k,s:suggest(tp,k)}});
 const col=o=>o>=.85?"#a3352b":o>=.65?"#a97a1f":o>=.4?"#1f7a8c":"#5d6b7e";
 return`<header class="top"><div><h1>Dynamic pricing</h1><p>Suggested rates for the next 14 days, from forecast demand, events and competitor rates</p></div><div class="bar"><select id="pt" aria-label="Room type">${ROOMS.map(x=>`<option value="${x.id}" ${x.id===tp?"selected":""}>${x.name}</option>`).join("")}</select><button id="applyall">Apply all suggestions</button></div></header>
 <div class="grid c2"><div class="card"><h3>Demand calendar</h3><div class="heat">${days.map(x=>`<div class="cell" style="background:${col(x.s.fo)}"><span>${DAYS[x.d.getDay()]} ${x.d.getDate()}</span><b>${pct(x.s.fo)}</b>${inr(x.s.rate)}</div>`).join("")}</div>
 <div class="legend"><span>Under 40% low</span><span>40–65% steady</span><span>65–85% strong</span><span>85%+ peak</span></div></div>
 <div class="card"><h3>Pricing rules</h3>
 ${[["weekend","Weekend uplift",25],["high","Strong-demand uplift",30],["lastmin","Last-minute discount",30],["comp","Competitor weight",60]].map(([k,l,m])=>`<div class="rule"><label for="r-${k}">${l}</label><input type="range" id="r-${k}" min="0" max="${m}" value="${rules[k]}" data-rule="${k}"><span id="rv-${k}">${rules[k]}%</span></div>`).join("")}
 <small style="color:var(--mute)">Rates stay between ${inr(r.min)} and ${inr(r.max)}.</small></div></div>
 <div class="card scroll" style="margin-top:14px"><table><tr><th>Date</th><th>Forecast occ.</th><th>Current rate</th><th>Suggested</th><th>Change</th><th>Market avg</th><th>Drivers</th><th></th></tr>
 ${days.map(x=>{const c=cur(tp,x.k),ch=(x.s.rate-c)/c;return`<tr><td>${DAYS[x.d.getDay()]} ${x.k}</td><td>${pct(x.s.fo)}</td><td>${inr(c)}</td><td><b>${inr(x.s.rate)}</b></td><td class="${ch>=0?"up":"dn"}">${ch>=0?"+":""}${(ch*100).toFixed(1)}%</td><td>${inr(x.s.avg)}</td><td>${x.s.why.map(w=>`<span class="tag">${w}</span>`).join(" ")||"–"}</td><td><button class="sm" data-apply="${x.k}" ${applied[tp+"|"+x.k]===x.s.rate?"disabled":""}>${applied[tp+"|"+x.k]===x.s.rate?"Applied":"Apply"}</button></td></tr>`}).join("")}</table></div>`},

forecast(){const labels=[],oc=[],ot=[],rv=[];let tot=0;
 for(let i=0;i<30;i++){const d=add(TODAY,i),k=iso(d);labels.push(d.getDate()+"/"+(d.getMonth()+1));oc.push(sold(k)/cap()*100);ot.push(forecastOcc(k)*100);
  let r=0;ROOMS.forEach(x=>{r+=forecastOcc(k,x.id)*x.total*suggest(x.id,k).rate});rv.push(r);tot+=r}
 return`<header class="top"><div><h1>Demand forecast</h1><p>Next 30 days: bookings on the books versus expected final occupancy</p></div></header>
 <div class="grid k4"><div class="card kpi"><div class="l">Forecast revenue (30 days)</div><div class="v">${inr(tot)}</div></div>
 <div class="card kpi"><div class="l">Avg forecast occupancy</div><div class="v">${(ot.reduce((a,b)=>a+b)/30).toFixed(0)}%</div></div>
 <div class="card kpi"><div class="l">Peak day</div><div class="v">${labels[ot.indexOf(Math.max(...ot))]}</div></div>
 <div class="card kpi"><div class="l">Softest day</div><div class="v">${labels[ot.indexOf(Math.min(...ot))]}</div></div></div>
 <div class="card" style="margin-top:14px"><h3>Occupancy %</h3>${lines([{name:"On the books",data:oc,c:"var(--teal)",fmt:v=>v.toFixed(0)+"%"},{name:"Forecast",data:ot,c:"var(--brass)",dash:1,fmt:v=>v.toFixed(0)+"%"}],labels)}</div>
 <div class="card" style="margin-top:14px"><h3>Forecast revenue per day</h3>${bars(rv.slice(0,14),labels.slice(0,14))}</div>`},

competitors(){const tp=VIEWS._ct||"DLX",ds=Array.from({length:7},(_,i)=>iso(add(TODAY,i)));
 return`<header class="top"><div><h1>Competitor rates</h1><p>Rate shopping for the week ahead. Add the hotels you compete with. Their rates are estimated from the price level you enter.</p></div><select id="ct" aria-label="Room type">${ROOMS.map(x=>`<option value="${x.id}" ${x.id===tp?"selected":""}>${x.name}</option>`).join("")}</select></header>
 <div class="card" style="margin-bottom:14px"><h3>Add a competitor</h3>
 <div class="bar"><input id="c-name" placeholder="Hotel name" aria-label="Competitor name" maxlength="40"><input id="c-level" type="number" min="50" max="200" value="100" style="width:110px" aria-label="Price level in percent of your base rate"><span style="color:var(--mute)">% of your base rate (110 = 10% more expensive)</span><button id="c-add">Add competitor</button></div>
 ${COMPS.length?"":"<p style='color:var(--mute);margin:0'>No competitors yet. Add one to compare rates and feed the pricing suggestions.</p>"}</div>
 <div class="card scroll"><table><tr><th>Hotel</th>${ds.map(d=>`<th>${d.slice(5)}</th>`).join("")}</tr>
 <tr><td><b>Meridian (you)</b></td>${ds.map(d=>`<td><b>${inr(cur(tp,d))}</b></td>`).join("")}</tr>
 ${COMPS.map((c,i)=>`<tr><td>${esc(c.n)} <button class="alt sm" data-rmcomp="${i}" aria-label="Remove ${esc(c.n)}">Remove</button></td>${ds.map(d=>`<td>${inr(compRate(c,tp,d))}</td>`).join("")}</tr>`).join("")}
 <tr><td>Rate position</td>${ds.map(d=>{const a=marketAvg(tp,d),x=(cur(tp,d)/a-1)*100;return`<td class="${x>5?"dn":x<-5?"up":""}">${x>=0?"+":""}${x.toFixed(0)}% ${x>5?"above":x<-5?"below":"in line"}</td>`}).join("")}</tr></table></div>`},

reports(){const m=kpis(add(TODAY,-30),add(TODAY,-1));
 return`<header class="top"><div><h1>Reports</h1><p>Download data for your review or to share with the team</p></div><button class="alt" onclick="print()">Print this page</button></header>
 <div class="grid c2e"><div class="card"><h3>Daily performance, last 30 days</h3><p style="color:var(--mute)">Occupancy, ADR, RevPAR and revenue for each day.</p><button id="r1">Download CSV</button></div>
 <div class="card"><h3>Reservations</h3><p style="color:var(--mute)">${bookings.length} bookings with channel, rate and status.</p><button id="r2">Download CSV</button></div>
 <div class="card"><h3>Price suggestions, 14 days</h3><p style="color:var(--mute)">Suggested rate and drivers for every room type.</p><button id="r3">Download CSV</button></div>
 <div class="card"><h3>Summary</h3><table><tr><td>Occupancy</td><td>${pct(m.occ)}</td></tr><tr><td>ADR</td><td>${inr(m.adr)}</td></tr><tr><td>RevPAR</td><td>${inr(m.revpar)}</td></tr><tr><td>Room revenue</td><td>${inr(m.rev)}</td></tr></table></div></div>`}
};
const TITLES={dashboard:"Dashboard",bookings:"Bookings",rooms:"Rooms and rates",pricing:"Dynamic pricing",forecast:"Forecast",competitors:"Competitors",reports:"Reports"};

/* ---------- Router + events ---------- */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function render(){const v=(location.hash.slice(1)||"dashboard");const name=VIEWS[v]&&v[0]!=="_"?v:"dashboard";
 $("#nav").innerHTML=Object.keys(TITLES).map(k=>`<a href="#${k}" class="${k===name?"on":""}">${TITLES[k]}</a>`).join("");
 $("#view").innerHTML=VIEWS[name]();bind(name)}
function bind(v){
 if(v==="bookings"){$("#st").value=VIEWS._st||"All";
  $("#q").oninput=e=>{VIEWS._q=e.target.value;const p=e.target.selectionStart;render();const q=$("#q");q.focus();q.setSelectionRange(p,p)};
  $("#st").onchange=e=>{VIEWS._st=e.target.value;render()};
  $("#newb").onclick=()=>{$("#f-in").value=iso(TODAY);$("#dlg").showModal()};
  $("#expb").onclick=()=>csv("bookings.csv",[["ID","Guest","Room","Check-in","Nights","Channel","Rate","Status"],...bookings.map(b=>[b.id,b.guest,room(b.type).name,b.in,b.n,b.ch,b.rate,b.status])]);
  $$("[data-cancel]").forEach(b=>b.onclick=()=>{bookings.find(x=>x.id==b.dataset.cancel).status="Cancelled";toast("Booking cancelled");render()})}
 if(v==="rooms")$$("[data-base]").forEach(i=>i.onchange=()=>{const r=room(i.dataset.base),n=+i.value;if(n<r.min||n>r.max){toast(`Base rate must stay between ${inr(r.min)} and ${inr(r.max)}`);render();return}r.base=n;toast("Base rate updated");render()});
 if(v==="pricing"){$("#pt").onchange=e=>{VIEWS._pt=e.target.value;render()};
  $$("[data-rule]").forEach(i=>i.oninput=()=>{rules[i.dataset.rule]=+i.value;$("#rv-"+i.dataset.rule).textContent=i.value+"%"});
  $$("[data-rule]").forEach(i=>i.onchange=render);
  $$("[data-apply]").forEach(b=>b.onclick=()=>{const t=VIEWS._pt||"STD";applied[t+"|"+b.dataset.apply]=suggest(t,b.dataset.apply).rate;toast("Rate applied for "+b.dataset.apply);render()});
  $("#applyall").onclick=()=>{const t=VIEWS._pt||"STD";for(let i=1;i<=14;i++){const k=iso(add(TODAY,i));applied[t+"|"+k]=suggest(t,k).rate}toast("14 rates applied");render()}}
 if(v==="competitors"){$("#ct").onchange=e=>{VIEWS._ct=e.target.value;render()};
  $("#c-add").onclick=()=>{const n=$("#c-name").value.trim(),l=+$("#c-level").value;
   if(!n){toast("Enter the competitor's hotel name");return}
   if(!(l>=50&&l<=200)){toast("Price level must be between 50 and 200");return}
   if(COMPS.some(c=>c.n.toLowerCase()===n.toLowerCase())){toast(n+" is already in the list");return}
   COMPS.push({n,f:l/100});toast(n+" added");render()};
  $("#c-name").onkeydown=e=>{if(e.key==="Enter")$("#c-add").click()};
  $$("[data-rmcomp]").forEach(b=>b.onclick=()=>{const c=COMPS.splice(+b.dataset.rmcomp,1)[0];toast(c.n+" removed");render()})}
 if(v==="reports"){
  $("#r1").onclick=()=>{const rows=[["Date","Occupancy","ADR","RevPAR","Revenue"]];for(let i=30;i>=1;i--){const d=add(TODAY,-i),k=kpis(d,d);rows.push([iso(d),pct(k.occ),Math.round(k.adr),Math.round(k.revpar),k.rev])}csv("daily-performance.csv",rows)};
  $("#r2").onclick=()=>csv("reservations.csv",[["ID","Guest","Room","Check-in","Nights","Channel","Rate","Status"],...bookings.map(b=>[b.id,b.guest,room(b.type).name,b.in,b.n,b.ch,b.rate,b.status])]);
  $("#r3").onclick=()=>{const rows=[["Room","Date","Forecast occupancy","Current rate","Suggested rate","Drivers"]];ROOMS.forEach(r=>{for(let i=1;i<=14;i++){const k=iso(add(TODAY,i)),s=suggest(r.id,k);rows.push([r.name,k,pct(s.fo),cur(r.id,k),s.rate,s.why.join("; ")])}});csv("price-suggestions.csv",rows)}}}
$("#f-type").innerHTML=ROOMS.map(r=>`<option value="${r.id}">${r.name}</option>`).join("");
$("#f-ch").innerHTML=CHANNELS.map(c=>`<option>${c}</option>`).join("");
$("#f-cancel").onclick=()=>$("#dlg").close();
$("#f-save").onclick=()=>{const g=$("#f-guest").value.trim(),n=+$("#f-n").value,d=$("#f-in").value,t=$("#f-type").value;
 if(!g||!d||n<1){toast("Enter guest name, check-in date and nights");return}
 const free=Array.from({length:n},(_,i)=>iso(add(new Date(d+"T00:00"),i))).every(k=>sold(k,t)<room(t).total);
 if(!free){toast("No "+room(t).name+" rooms left for those dates");return}
 bookings.push({id:Math.max(...bookings.map(b=>b.id))+1,guest:g,type:t,in:d,n,ch:$("#f-ch").value,rate:cur(t,d),status:"Confirmed"});
 $("#dlg").close();$("#f-guest").value="";toast("Booking saved at "+inr(cur(t,d))+" per night");render()};
addEventListener("hashchange",render);render();