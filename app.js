const view=document.querySelector("#view"), backdrop=document.querySelector("#modalBackdrop"), modal=document.querySelector("#modal"), toastEl=document.querySelector("#toast");
const KEY="nexora_v1";
const emptyState={posts:[],profile:{name:"Usuario",handle:"@usuario",bio:"",tags:[],followers:0,following:0},joined:[],pollVotes:{},messages:[],chat:[]};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||emptyState;
let currentUser=null;
let supabaseClient=null;
let authMode="login";

let page="home",feedTab="Para ti",currentChat="Kai",photoData=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function toast(s){toastEl.textContent=s;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2200)}
function avatar(initial,tone=""){return `<div class="avatar ${tone}">${esc(initial)}</div>`}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function head(title,sub="",right=""){return `<div class="page-head"><div><h1>${title}</h1>${sub?`<p class="sub">${sub}</p>`:""}</div>${right}</div>`}
function render(){
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 if(page==="home")home();else if(page==="explore")explore();else if(page==="groups")groups();else if(page==="profile")profile();else if(page==="inbox")inbox();else if(page==="chat")chat();else if(page==="search")searchPage();
}
function postCard(p){let liked=!!p.reactions?.like;return `<article class="post"><div class="post-head">${avatar(p.initial,p.tone)}<div class="post-author"><strong>${esc(p.user)}</strong><div class="handle">${esc(p.handle)} · ${p.time}</div></div><button class="more" data-more="${p.id}">⋮</button></div><p class="post-text">${esc(p.text)}</p>${p.image?(p.photo?`<img class="post-image" src="${p.photo}" alt="Fotografía publicada" loading="lazy">`:`<div class="image-placeholder">NEXØRA ✦</div>`):""}${p.poll?`<div class="poll-box">${p.poll.options.map((o,i)=>`<button class="poll-option" data-vote="${p.id}" data-option="${i}"><span>${esc(o)}</span><small>${p.poll.votes[i]||0} votos</small></button>`).join("")}</div>`:""}<div class="post-meta"><span>${p.likes||0} reacciones</span><span>${p.comments||0} comentarios</span></div><div class="post-actions"><div class="reaction-wrap"><button class="post-action ${liked?"liked":""}" data-reaction="${p.id}">${liked?"♥":"♡"} Reaccionar</button><div class="reaction-bar"><button data-emoji="❤️" data-id="${p.id}">❤️</button><button data-emoji="👍" data-id="${p.id}">👍</button><button data-emoji="😢" data-id="${p.id}">😢</button><button data-emoji="😡" data-id="${p.id}">😡</button><button data-emoji="😮" data-id="${p.id}">😮</button><button data-emoji="😕" data-id="${p.id}">😕</button></div></div><button class="post-action" data-comment="${p.id}">▢ Comentar</button><button class="post-action" data-share="${p.id}">↗ Compartir</button></div></article>`}
function home(){view.innerHTML=`${head("NEXØRA","Un lugar para compartir lo que te gusta.")}<div class="tabs">${["Para ti","Siguiendo","Chats"].map(t=>`<button class="tab ${feedTab===t?"active":""}" data-feedtab="${t}">${t}</button>`).join("")}</div>${feedTab==="Chats"?inboxContent():`<div class="composer-short">${avatar("R")}<button class="composer-trigger" id="composerTrigger">¿Qué quieres compartir hoy?</button><button class="quick-add" id="quickAdd">＋</button></div><div class="feed-tools"><span>Publicaciones recientes</span><button class="filter" id="sortBtn">◉ Recientes</button></div>${state.posts.map(postCard).join("")}`}`}
const groupsData=[["Gaming Zone","Juegos, recomendaciones y partidas.","1.2k miembros"],["Arte & Creatividad","Comparte tus dibujos, diseños e ideas.","846 miembros"],["Tecnología móvil","Android, apps y optimización.","532 miembros"],["Música para todos","Descubre y comparte música.","2.1k miembros"]];
function groups(){view.innerHTML=`${head("Grupos","Encuentra tu comunidad.",`<button class="primary-btn" id="newGroup">＋ Crear grupo</button>`)}<div class="card-grid">${groupsData.map((g,i)=>`<article class="group-card"><div class="group-cover"></div><h3>${g[0]}</h3><p>${g[1]}</p><span class="pill">${g[2]}</span><div style="margin-top:13px"><button class="small-btn" data-join="${i}">${state.joined.includes(i)?"✓ Unido":"Unirme"}</button></div></article>`).join("")}</div>`}
function profile(){let p=state.profile;view.innerHTML=`${head("Mi perfil","Tu espacio dentro de la comunidad.",`<button class="round-btn" id="profileInbox">✉</button>`)}<section class="profile-hero"><div class="profile-cover"></div>${avatar(p.name[0]||"R","profile-avatar")}<h2>${esc(p.handle)}</h2><p class="bio">${esc(p.bio)}</p><div class="stats"><div><b>${state.posts.filter(x=>x.handle===p.handle).length}</b><small>Publicaciones</small></div><div><b>${p.followers}</b><small>Seguidores</small></div><div><b>${p.following}</b><small>Siguiendo</small></div></div><div class="tags">${p.tags.map(t=>`<span class="pill">♟ ${esc(t)}</span>`).join("")}</div><div class="profile-actions"><button class="outline-btn" id="editProfile">✎ Editar perfil</button><button class="outline-btn" id="shareProfile">↗ Compartir</button><button class="outline-btn" id="signOutBtn">Salir</button></div></section><h3 class="section-title">Tus publicaciones</h3>${state.posts.filter(x=>x.handle===p.handle).length?state.posts.filter(x=>x.handle===p.handle).map(postCard).join(""):`<div class="empty"><b>Aún no has publicado.</b>Comparte una idea para empezar.</div>`}`}
function explore(){view.innerHTML=`${head("Explorar","Descubre publicaciones y personas.")}<button class="composer-trigger" style="width:100%;text-align:left;margin-bottom:16px" id="searchTrigger">⌕ Buscar personas, temas o grupos...</button><h3 class="section-title">Temas populares</h3><div class="tags" style="justify-content:flex-start;margin:0">${["#Gaming","#Android","#Música","#Fotografía","#Programación","#Memes"].map(t=>`<span class="pill">${t}</span>`).join("")}</div><h3 class="section-title">Publicaciones que podrían gustarte</h3>${state.posts.map(postCard).join("")}`}
function inboxContent(){return `<div>${state.messages.map(m=>`<button class="chat-row" style="width:100%;text-align:left" data-chat="${esc(m.name)}">${avatar(m.initial,m.tone)}<div class="chat-info"><b>${esc(m.name)}</b><p>${esc(m.last)}</p></div><span class="chat-time">${m.time}</span></button>`).join("")}</div>`}
function inbox(){view.innerHTML=`${head("Chats","Tus conversaciones privadas.",`<button class="primary-btn" id="newChat">＋ Nuevo chat</button>`)}${inboxContent()}`}
function chat(){let msgs=state.chat.filter(m=>m.to===currentChat);view.innerHTML=`${head("‹ "+esc(currentChat),"Conversación privada.")}<div style="min-height:48vh;display:flex;flex-direction:column;justify-content:flex-end">${msgs.map(m=>`<div class="chat-bubble ${m.mine?"mine":""}">${esc(m.text)}</div>`).join("")}</div><form class="chat-compose" id="chatForm"><input id="chatText" placeholder="Escribe un mensaje..." autocomplete="off"><button class="primary-btn">➤</button></form>`}
function searchPage(){view.innerHTML=`${head("Buscar","Encuentra gente y comunidades.")}<input class="field" id="searchInput" placeholder="Escribe para buscar..." autofocus><div id="searchResults"></div>`;$("#searchInput").focus()}
function openModal(content){modal.innerHTML=content;backdrop.classList.remove("hidden")}
function closeModal(){backdrop.classList.add("hidden");photoData=null}
function createModal(){openModal(`<div class="modal-top"><h2>Crear publicación</h2><button class="close" data-close>×</button></div><form id="postForm"><label class="form-label">¿Qué quieres compartir hoy?</label><textarea class="field textarea" id="postText" maxlength="540" placeholder="Comparte una idea con la comunidad..."></textarea><label class="form-label">Descripción (opcional)</label><input class="field" id="postDesc" maxlength="300" placeholder="Añade un poco más de contexto..."><label class="form-label">Enlace (opcional)</label><input class="field" id="postLink" type="url" placeholder="https://..."><div class="switch-row"><span><b>Agregar votación</b><br><small style="color:var(--muted)">La gente vota y ve el porcentaje de cada opción</small></span><input class="switch" type="checkbox" id="pollToggle"></div><div id="pollFields" class="hidden"><input class="field option-input" placeholder="Opción 1"><input class="field option-input" placeholder="Opción 2"><button type="button" class="outline-btn" id="addOption">＋ Agregar opción</button></div><label class="upload-btn">▧ Añadir fotografía<input type="file" id="postPhoto" accept="image/*"></label><p class="sub" id="photoName">Las fotos se optimizan antes de guardarse.</p><button class="primary-btn modal-submit">➤ Publicar</button></form>`)}
function editProfileModal(){let p=state.profile;openModal(`<div class="modal-top"><h2>Editar perfil</h2><button class="close" data-close>×</button></div><form id="profileForm"><label class="form-label">Nombre visible</label><input class="field" id="pName" maxlength="32" value="${esc(p.name)}"><label class="form-label">Usuario</label><input class="field" id="pHandle" maxlength="24" value="${esc(p.handle)}"><label class="form-label">Bio</label><textarea class="field textarea" id="pBio" maxlength="160" placeholder="Cuéntale algo a la comunidad...">${esc(p.bio)}</textarea><label class="form-label">Intereses (separados por coma)</label><input class="field" id="pTags" value="${esc(p.tags.join(", "))}"><button class="primary-btn modal-submit">Guardar cambios</button></form>`)}
function handleClick(e){
 const t=e.target.closest("button");if(!t)return;
 if(t.dataset.page){page=t.dataset.page;render();return}
 if(t.id==="createOpen"||t.id==="composerTrigger"||t.id==="quickAdd"){createModal();return}
 if(t.id==="searchOpen"||t.id==="searchTrigger"){page="search";render();return}
 if(t.id==="inboxOpen"||t.id==="profileInbox"){page="inbox";render();return}
 if(t.dataset.feedtab){feedTab=t.dataset.feedtab;render();return}
 if(t.dataset.close){closeModal();return}
 if(t.id==="editProfile"){editProfileModal();return}
 if(t.id==="newChat"){toast("Busca un perfil para iniciar una conversación.");page="search";render();return}
 if(t.id==="newGroup"){toast("La creación de grupos se conectará al servidor en la siguiente etapa.");return}
 if(t.dataset.join!==undefined){let i=+t.dataset.join;state.joined=state.joined.includes(i)?state.joined.filter(x=>x!==i):[...state.joined,i];save();groups();return}
 if(t.dataset.chat){currentChat=t.dataset.chat;page="chat";render();return}
 if(t.dataset.reaction){t.parentElement.classList.toggle("open");return}
 if(t.dataset.emoji){let p=state.posts.find(x=>x.id==t.dataset.id);p.reactions=p.reactions||{};p.reactions.like=t.dataset.emoji==="❤️"?!p.reactions.like:true;if(p.reactions.like)p.likes++;else p.likes=Math.max(0,p.likes-1);save();render();return}
 if(t.dataset.comment){toast("Los comentarios estarán disponibles al conectar la base de datos.");return}
 if(t.dataset.share){toast("Enlace de publicación copiado (demo).");return}
 if(t.dataset.more){toast("Opciones de publicación: próximamente.");return}
 if(t.dataset.vote){let p=state.posts.find(x=>x.id==t.dataset.vote);p.poll.votes[+t.dataset.option]=(p.poll.votes[+t.dataset.option]||0)+1;save();render();return}
 if(t.id==="addOption"){let wrap=$("#pollFields");if(wrap.querySelectorAll("input").length<5){let inp=document.createElement("input");inp.className="field option-input";inp.placeholder="Otra opción";wrap.insertBefore(inp,t)}else toast("Máximo 5 opciones.");return}
 if(t.id==="editProfile"){editProfileModal();return}
 if(t.id==="shareProfile"){toast("Perfil listo para compartir.");return}
 if(t.id==="signOutBtn"){if(supabaseClient)supabaseClient.auth.signOut();return}
}
document.addEventListener("click",handleClick);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal()});
document.addEventListener("change",async e=>{if(e.target.id==="pollToggle")$("#pollFields").classList.toggle("hidden",!e.target.checked);if(e.target.id==="postPhoto"){let f=e.target.files[0];if(!f)return;if(f.size>8*1024*1024){toast("La foto debe pesar menos de 8 MB.");e.target.value="";return}try{photoData=await compress(f);$("#photoName").textContent="Fotografía optimizada ✓"}catch{toast("No se pudo procesar la fotografía.")}}});
async function compress(file){let url=URL.createObjectURL(file),img=new Image();img.src=url;await img.decode();let scale=Math.min(1,1440/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);return new Promise(res=>c.toBlob(b=>{let r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(b)},"image/webp",.78))}
document.addEventListener("submit",e=>{
 if(e.target.id==="postForm"){e.preventDefault();let text=$("#postText").value.trim(),desc=$("#postDesc").value.trim(),link=$("#postLink").value.trim();if(!text&&!photoData){toast("Escribe algo o añade una foto.");return}let poll=null;if($("#pollToggle").checked){let opts=[...$("#pollFields").querySelectorAll("input")].map(x=>x.value.trim()).filter(Boolean);if(opts.length<2){toast("Una encuesta necesita al menos dos opciones.");return}poll={options:opts,votes:{}}}let p={id:Date.now(),user:state.profile.name,handle:state.profile.handle,initial:state.profile.name[0],time:"ahora",text:[text,desc,link].filter(Boolean).join("\n"),image:!!photoData,photo:photoData,likes:0,comments:0,reactions:{},poll};state.posts.unshift(p);save();closeModal();page="home";feedTab="Para ti";render();toast("¡Publicación creada!");}
 if(e.target.id==="profileForm"){e.preventDefault();state.profile.name=$("#pName").value.trim()||"Usuario";state.profile.handle=$("#pHandle").value.trim().startsWith("@")?$("#pHandle").value.trim():"@"+$("#pHandle").value.trim();state.profile.bio=$("#pBio").value.trim();state.profile.tags=$("#pTags").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);save();closeModal();render();toast("Perfil actualizado.");}
 if(e.target.id==="chatForm"){e.preventDefault();let text=$("#chatText").value.trim();if(!text)return;state.chat.push({to:currentChat,text,mine:true});let m=state.messages.find(x=>x.name===currentChat);if(m){m.last=text;m.time="ahora"}save();render();}
});
document.addEventListener("input",e=>{if(e.target.id==="searchInput"){let q=e.target.value.toLowerCase(),results=$("#searchResults");if(!results)return;let names=["Luna","Kai","Mika","Gaming Zone","Arte & Creatividad","Tecnología móvil"].filter(x=>x.toLowerCase().includes(q));results.innerHTML=names.map(n=>`<div class="chat-row">${avatar(n[0])}<div class="chat-info"><b>${esc(n)}</b><p>Perfil o comunidad</p></div></div>`).join("")||`<div class="empty">No encontramos resultados.</div>`}});
function authMessage(message, isError=false){const el=document.querySelector("#authMessage");if(el){el.textContent=message;el.className="auth-message"+(isError?" error":"");}}
function authMarkup(){
 const root=document.querySelector("#authContent");
 if(authMode==="signup"){
  root.innerHTML=`<h1>Crea tu cuenta</h1><p class="auth-description">Empieza a formar parte de NEXØRA.</p><form id="signUpForm" class="auth-form"><label>Nombre visible</label><input class="auth-input" id="signupDisplay" maxlength="32" placeholder="Cómo te llamas" required><label>Nombre de usuario</label><input class="auth-input" id="signupUsername" maxlength="20" pattern="[A-Za-z0-9_.]+" placeholder="tu_usuario" required><label>Correo electrónico</label><input class="auth-input" id="signupEmail" type="email" autocomplete="email" placeholder="tu@correo.com" required><label>Contraseña</label><input class="auth-input" id="signupPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres" required><button class="auth-submit" type="submit">Crear cuenta <span>→</span></button></form><p id="authMessage" class="auth-message"></p><p class="auth-switch">¿Ya tienes cuenta? <button type="button" data-auth-mode="login">Inicia sesión</button></p>`;
 }else if(authMode==="recovery"){
  root.innerHTML=`<h1>Recuperar contraseña</h1><p class="auth-description">Te enviaremos un enlace para restablecerla.</p><form id="recoveryForm" class="auth-form"><label>Correo electrónico</label><input class="auth-input" id="recoveryEmail" type="email" autocomplete="email" placeholder="tu@correo.com" required><button class="auth-submit" type="submit">Enviar enlace <span>→</span></button></form><p id="authMessage" class="auth-message"></p><p class="auth-switch"><button type="button" data-auth-mode="login">Volver al inicio de sesión</button></p>`;
 }else{
  root.innerHTML=`<h1>Qué bueno tenerte de vuelta.</h1><p class="auth-description">Inicia sesión para entrar a tu comunidad.</p><form id="signInForm" class="auth-form"><label>Correo electrónico</label><input class="auth-input" id="loginEmail" type="email" autocomplete="email" placeholder="tu@correo.com" required><label>Contraseña</label><input class="auth-input" id="loginPassword" type="password" autocomplete="current-password" placeholder="Tu contraseña" required><button class="auth-forgot" type="button" data-auth-mode="recovery">¿Olvidaste tu contraseña?</button><button class="auth-submit" type="submit">Iniciar sesión <span>→</span></button></form><p id="authMessage" class="auth-message"></p><div class="auth-divider"><span>¿Primera vez en NEXØRA?</span></div><button class="auth-secondary" type="button" data-auth-mode="signup">Crear una cuenta</button>`;
 }
}
function showAuth(mode="login"){authMode=mode;document.querySelector("#appShell").classList.add("hidden");document.querySelector("#authScreen").classList.remove("hidden");authMarkup();}
function showApp(user){currentUser=user;document.querySelector("#authScreen").classList.add("hidden");document.querySelector("#appShell").classList.remove("hidden");const meta=user.user_metadata||{};const display=meta.display_name||user.email?.split("@")[0]||"Usuario";const username=meta.username||("user_"+user.id.slice(0,8));state.profile={...emptyState.profile,...state.profile,name:display,handle:"@"+username};const avatar=document.querySelector("#topAvatar");if(avatar)avatar.textContent=(display[0]||"N").toUpperCase();save();render();}
async function initAuth(){
 const url=window.NEXORA_SUPABASE_URL,key=window.NEXORA_SUPABASE_PUBLISHABLE_KEY;
 if(!window.supabase||!url||!key||url.includes("PEGA_AQUI")||key.includes("PEGA_AQUI")){showAuth("login");authMessage("Falta configurar la URL y la Publishable key de Supabase en supabase-config.js.",true);return;}
 supabaseClient=window.supabase.createClient(url,key);
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session?.user)showApp(session.user);else showAuth("login");
 supabaseClient.auth.onAuthStateChange((_event,session)=>{if(session?.user)showApp(session.user);else{currentUser=null;showAuth("login");}});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-auth-mode]");if(b)showAuth(b.dataset.authMode);});
document.addEventListener("submit",async e=>{
 if(["signInForm","signUpForm","recoveryForm"].includes(e.target.id)){
  e.preventDefault();if(!supabaseClient){authMessage("Primero configura Supabase en supabase-config.js.",true);return;}
  const submit=e.target.querySelector("button[type=submit]");submit.disabled=true;submit.textContent="Un momento…";
  try{
   if(e.target.id==="signInForm"){
    const {data,error}=await supabaseClient.auth.signInWithPassword({email:document.querySelector("#loginEmail").value.trim(),password:document.querySelector("#loginPassword").value});if(error)throw error;if(data.user)showApp(data.user);
   }else if(e.target.id==="signUpForm"){
    const display=document.querySelector("#signupDisplay").value.trim(),username=document.querySelector("#signupUsername").value.trim().toLowerCase().replace(/^@/,""),email=document.querySelector("#signupEmail").value.trim(),password=document.querySelector("#signupPassword").value;
    if(!/^[a-z0-9_.]{3,20}$/.test(username))throw new Error("El usuario debe tener entre 3 y 20 caracteres: letras, números, punto o guion bajo.");
    const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{username,display_name:display}}});if(error)throw error;
    if(data.session&&data.user)showApp(data.user);else{authMessage("¡Cuenta creada! Revisa tu correo y confirma la dirección antes de iniciar sesión.");e.target.reset();}
   }else{
    const email=document.querySelector("#recoveryEmail").value.trim();const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});if(error)throw error;authMessage("Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.");
   }
  }catch(err){authMessage(err.message||"No se pudo completar la operación.",true);}finally{if(submit){submit.disabled=false;submit.textContent=e.target.id==="signInForm"?"Iniciar sesión →":e.target.id==="signUpForm"?"Crear cuenta →":"Enviar enlace →";}}
 }
});
function init(){initAuth();if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
init();
