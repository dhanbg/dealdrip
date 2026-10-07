import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => 'Rs. ' + n.toLocaleString('en-US');
const catalog = [
  {id:'speaker',name:'Speaker & charging dock',file:'speaker-web',category:'Audio',price:3000,finish:'Graphite',color:'#424744',badge:'Everyday favorite',description:'Sound, time, and a cleaner bedside. An understated object with more than one way to fit into your day.',features:['Fabric-wrapped body','Integrated clock display','Circular charging surface']},
  {id:'scarlett3',name:'Scarlett Solo · 3rd Gen',file:'scarlett-solo-3rd-gen-web',category:'Audio',price:23000,finish:'Studio red',color:'#9d2534',badge:'Studio edit',description:'For the ideas that deserve to be heard. A focused recording setup, in an unmistakable red finish.',features:['Compact desktop interface','Front-panel controls','Explore the connections in 3D']},
  {id:'keyboard',name:'TWOLF TF200 keyboard',file:'twolf-tf200-keyboard-web',category:'Gaming',price:1000,finish:'Black / multicolor',color:'#23252a',badge:'Play in 3D',description:'A little color. A lot of character. Build a setup that feels like you, down to the very last key.',features:['Full-size keyboard layout','Multicolor key accents','Try the interactive typing demo']},
  
  {id:'bottle',name:'Foldable silicone bottle',file:'silicone-foldable-bottle-web',category:'Everyday',price:700,finish:'Cloud',color:'#d4d7cb',badge:'Go lightly',description:'A little less bulk, a little more freedom. An everyday companion with a distinctive folding silhouette.',features:['Flexible folded silhouette','Compact everyday design','Cloud-colored finish']},
  {id:'premium',name:'3-in-1 cable · Premium',file:'3-in-1-premium-web',category:'Everyday',price:700,finish:'Soft lavender',color:'#c6bfd4',badge:'7 finishes',description:'One compact little object for a better-connected everyday. The considered addition to your carry, available in 7 expressive finishes.',features:['Three connector ends','Retractable cable design','7 vibrant finishes'],variants:[{id:'red',name:'Crimson red',color:'#c52233',image:'./assets/previews/3-in-1-premium-web-red.png'},{id:'navy',name:'Navy blue',color:'#1a294a',image:'./assets/previews/3-in-1-premium-web-navy.png'},{id:'green',name:'Pine green',color:'#2d5a43',image:'./assets/previews/3-in-1-premium-web-green.png'},{id:'black',name:'Obsidian black',color:'#1f232b',image:'./assets/previews/3-in-1-premium-web-black.png'},{id:'white',name:'Pearl white',color:'#f5f6f8',image:'./assets/previews/3-in-1-premium-web-white.png'},{id:'orange',name:'Sunset orange',color:'#f26435',image:'./assets/previews/3-in-1-premium-web-orange.png'},{id:'lavender',name:'Soft lavender',color:'#c6bfd4',image:'./assets/previews/3-in-1-premium-web-lavender.png'}],defaultVariant:'lavender'},
  {id:'scarlett4',name:'Scarlett Solo · 4th Gen',file:'scarlett-solo-4th-gen-web',category:'Audio',price:28000,finish:'Studio red',color:'#bc3440',description:'Your desk, ready for its next take. Explore a new generation of this instantly recognizable audio interface.',features:['Compact desktop form','Red metal exterior','Detailed front and rear controls']},
  {id:'f26',name:'F26 magnetic cooler',file:'f26-web',category:'Gaming',price:1500,finish:'Carbon / spectrum',color:'#303436',description:'A circular silhouette with an unexpected flash of color. Bring another point of view to your gaming setup.',features:['Round magnetic-pad design','Cyan and magenta fan accents','Detailed back-panel view']},
  {id:'f18',name:'F18 clamp cooler',file:'f18-web',category:'Gaming',price:1000,finish:'Black / violet',color:'#65529c',description:'Expressive details for a setup that stands out. Get closer to the sculpted housing and violet accents.',features:['Clamp-style housing','Violet side accents','Exposed fan design']},
  {id:'f25',name:'F25 clamp cooler',file:'f25-web',category:'Gaming',price:1200,finish:'Black / silver',color:'#8a8c8d',description:'Sharp lines, silver contrasts, and a little extra character. Look at your next accessory from every angle.',features:['Clamp-style silhouette','Silver-edged fan grille','Compact gaming accessory']},
  {id:'basic',name:'3-in-1 cable · Essential',file:'3-in-1-basic-web',category:'Everyday',price:500,finish:'Sage green',color:'#8fa88e',description:'A cheerful little connection. Three ends, one neatly gathered cable, and a bright spot in your everyday carry.',features:['Three connector ends','Round cable organizer','Two vibrant finishes'],variants:[{id:'green',name:'Sage green',color:'#8fa88e',image:'./assets/previews/3-in-1-basic-web-green.png'},{id:'red',name:'Coral red',color:'#eb3d3e',image:'./assets/previews/3-in-1-basic-web-red.png'}],defaultVariant:'green'}
];
const getProduct = id => catalog.find(p => p.id === id);
const preview = p => `./assets/previews/${p.file}.png`;
const chapters = [
 {id:'speaker',eyebrow:'CURATED TECH. NEW PERSPECTIVES.',title:'Beyond<br><span>the screen.</span>',description:'Thoughtful objects for extraordinary everyday moments. Find your next setup in a new dimension.',cta:'Explore the collection',category:'THE COLLECTION',kicker:'THE EVERYDAY UPGRADE',accent:'211,252,126'},
 {id:'scarlett3',eyebrow:'01 / THE SOUND OF POSSIBILITY',title:'Sound.<br><span>Unbound.</span>',description:'From the first idea to the final take. Make a little room for something worth listening to.',cta:'Explore audio',category:'AUDIO',kicker:'YOUR NEXT CREATIVE COMPANION',accent:'245,122,130'},
 {id:'keyboard',eyebrow:'02 / A DIFFERENT KIND OF PLAY',title:'Built for<br><span>your next.</span>',description:'Every key, a possibility. Make your workspace a place you actually want to play.',cta:'Try the keyboard',category:'GAMING',kicker:'MEET YOUR NEW FAVORITE KEYS',accent:'171,189,255'},
 
 {id:'bottle',eyebrow:'04 / TAKE A DIFFERENT ROUTE',title:'A lighter<br><span>everyday.</span>',description:'Pack a little possibility. Considered essentials that go wherever your day takes you.',cta:'Explore everyday',category:'EVERYDAY',kicker:'LESS BULK. MORE POSSIBILITY.',accent:'211,252,126'}
];
let filter = 'All', currentChapter = -1, currentProduct = null, quantity = 1;
const bag = new Map();
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
function renderProducts(){
 const products=catalog.filter(p=>filter==='All'||p.category===filter);
 $('#product-grid').innerHTML=products.map(p=>`<article class="product-card"><button class="product-image-button" data-product="${p.id}" aria-label="Explore ${p.name} in 3D"><span class="product-index">${String(catalog.indexOf(p)+1).padStart(2,'0')} /</span>${p.badge?`<span class="product-badge">${p.badge}</span>`:''}<img src="${preview(p)}" alt="${p.name}" width="760" height="640" loading="lazy"><span class="quickview-hint">Explore in 3D +</span></button><div class="product-info"><div><div class="product-category">${p.category}</div><h3><button data-product="${p.id}">${p.name}</button></h3><p class="product-price">${money(p.price)}</p></div><button class="add-circle" data-add="${p.id}" aria-label="Add ${p.name} to bag">+</button></div></article>`).join('');
 $('#product-counter').textContent=products.length+' objects';
 $$('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-selected',String(b.dataset.filter===filter));b.tabIndex=b.dataset.filter===filter?0:-1;});
}
function setFilter(category){if(!['All','Audio','Gaming','Everyday'].includes(category))throw Error('Unknown category');filter=category;renderProducts();}
function addToBag(id,count=1){const p=getProduct(id);if(!p||!Number.isInteger(count)||count<1||count>99)throw Error('Choose a valid product and quantity');const next=Math.min(99,(bag.get(id)||0)+count);bag.set(id,next);renderBag();toast(p.name+' added to your bag');return{product:id,quantity:next,totalItems:bagCount()};}
function bagCount(){return [...bag.values()].reduce((a,b)=>a+b,0);}
function bagTotal(){return [...bag].reduce((sum,[id,q])=>sum+getProduct(id).price*q,0);}
function renderBag(){
 $$('.bag-count').forEach(e=>e.textContent=bagCount());$('#bag-title-count').textContent=`(${bagCount()})`;
 $('#bag-items').innerHTML=bag.size?[...bag].map(([id,q])=>{const p=getProduct(id);return `<div class="bag-item"><img src="${preview(p)}" alt="${p.name}"><div><h3>${p.name}</h3><p class="bag-item-price">${money(p.price)}</p><div class="bag-item-controls"><button data-bag-change="${id}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span>${q}</span><button data-bag-change="${id}" data-delta="1" aria-label="Increase ${p.name} quantity">+</button><button class="remove-item" data-remove="${id}">Remove</button></div></div></div>`;}).join(''):'<div class="empty-bag"><div class="empty-symbol">✳</div><h3>A little room for possibility.</h3><p>Your next favorite object is out there.</p><button class="button button-dark" data-browse>Explore the collection</button></div>';
 $('#bag-summary').hidden=!bag.size;$('#bag-total').textContent=money(bagTotal());
}
function showDialog(dialog){$$('dialog[open]').forEach(d=>d.close());dialog.showModal();document.body.style.overflow='hidden';}
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';});});
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.hasAttribute('data-product'))openProduct(b.dataset.product);
 if(b.hasAttribute('data-add'))addToBag(b.dataset.add);
 if(b.hasAttribute('data-open-bag')){renderBag();showDialog($('#bag-dialog'));}
 if(b.hasAttribute('data-close-dialog'))b.closest('dialog')?.close();
 if(b.hasAttribute('data-filter'))setFilter(b.dataset.filter);
 if(b.hasAttribute('data-category')){setFilter(b.dataset.category);$('.mobile-nav').hidden=true;$('.menu-toggle').setAttribute('aria-expanded','false');}
 if(b.hasAttribute('data-browse')){$('#bag-dialog').close();$('#collection').scrollIntoView({behavior:reduceMotion?'instant':'smooth'});}
 if(b.hasAttribute('data-bag-change')){const id=b.dataset.bagChange;const q=Math.min(99,(bag.get(id)||0)+Number(b.dataset.delta));if(q<=0)bag.delete(id);else bag.set(id,q);renderBag();}
 if(b.hasAttribute('data-remove')){bag.delete(b.dataset.remove);renderBag();}
 if(b.hasAttribute('data-chapter'))goToChapter(Number(b.dataset.chapter));
});
$('.category-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-filter]');let i=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setFilter(tabs[i].dataset.filter);tabs[i].focus();});
$('.menu-toggle').addEventListener('click',()=>{const nav=$('.mobile-nav');nav.hidden=!nav.hidden;$('.menu-toggle').setAttribute('aria-expanded',String(!nav.hidden));});
$('#back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'}));
$('#quantity-minus').addEventListener('click',()=>{$('#modal-quantity').value=quantity=Math.max(1,quantity-1);});
$('#quantity-plus').addEventListener('click',()=>{$('#modal-quantity').value=quantity=Math.min(99,quantity+1);});
$('#modal-add').addEventListener('click',()=>{if(currentProduct)addToBag(currentProduct.id,quantity);});
$('#review-order').addEventListener('click',()=>{if(!bag.size)return;$('#checkout-items').innerHTML=[...bag].map(([id,q])=>`<div class="checkout-row"><span>${q} × ${getProduct(id).name}</span><span>${money(getProduct(id).price*q)}</span></div>`).join('');$('#checkout-total').textContent=money(bagTotal());showDialog($('#checkout-dialog'));});
$('#hero-quickview').addEventListener('click',()=>openProduct(chapters[Math.max(0,currentChapter)].id));
$('#caption-open').addEventListener('click',()=>openProduct(chapters[Math.max(0,currentChapter)].id));
$('#story-cta').addEventListener('click',()=>{const c=chapters[Math.max(0,currentChapter)];if(c.id==='keyboard')return;setFilter(c.category==='AUDIO'?'Audio':c.category==='GAMING'||c.category==='PRECISION'?'Gaming':c.category==='EVERYDAY'?'Everyday':'All');});
renderProducts();renderBag();
if(!reduceMotion){document.body.classList.add('motion-ready');const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}),{threshold:.1});$$('.reveal').forEach(e=>revealObserver.observe(e));}

const draco=new DRACOLoader().setDecoderPath('./assets/draco/').setWorkerLimit(2);
const loader=new GLTFLoader().setDRACOLoader(draco);
const modelCache=new Map();
function loadModel(p){if(!modelCache.has(p.id))modelCache.set(p.id,loader.loadAsync(`./assets/models/${p.file}.glb`).catch(e=>{modelCache.delete(p.id);throw e;}));return modelCache.get(p.id);}
function normalizedModel(gltf,size=3.4){const content=gltf.scene.clone(true);content.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(content),center=box.getCenter(new THREE.Vector3()),dimensions=box.getSize(new THREE.Vector3());content.position.sub(center);const normalizer=new THREE.Group();normalizer.add(content);normalizer.scale.setScalar(size/Math.max(dimensions.x,dimensions.y,dimensions.z));const group=new THREE.Group();group.add(normalizer);return{group,content,animations:gltf.animations};}
function makeStage(canvas,{exposure=1.2,background=null}={}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:!background,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=exposure;renderer.setClearColor(background??0x000000,background?1:0);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,0,8.8);camera.lookAt(0,0,0);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xffffff,0x545849,.6));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(4,6,7);scene.add(key);const rim=new THREE.DirectionalLight(0xd3fc9c,1.2);rim.position.set(-4,3,-2);scene.add(rim);
 let width=0,height=0;
 const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;if(width===r.width&&height===r.height)return;width=r.width;height=r.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return{renderer,scene,camera,resize,render(){resize();renderer.render(scene,camera);},dispose(){observer.disconnect();env.dispose();renderer.dispose();}};
}
function bindRotation(element,state){let down=false,lastX=0,lastY=0;const controller=new AbortController();const opt={signal:controller.signal};element.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;if(e.pointerType==='mouse')element.setPointerCapture(e.pointerId);},opt);element.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;state.y+=dx*.008;state.x=THREE.MathUtils.clamp(state.x+dy*.004,-.55,.6);lastX=e.clientX;lastY=e.clientY;},opt);['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(name=>element.addEventListener(name,()=>down=false,opt));element.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')state.y-=.15;if(e.key==='ArrowRight')state.y+=.15;if(e.key==='ArrowUp')state.x-=.1;if(e.key==='ArrowDown')state.x+=.1;}},opt);return()=>controller.abort();}

let heroStage=null,heroVisible=true,scrollPosition=0,scrollTarget=0;
const heroModels=new Map(),heroRotation={x:0,y:0};bindRotation($('#hero-drag'),heroRotation);
function updateChapter(i){if(i===currentChapter)return;currentChapter=i;const c=chapters[i],p=getProduct(c.id);$('#story-title').innerHTML=c.title;$('#story-eyebrow').textContent=c.eyebrow;$('#story-description').textContent=c.description;$('#story-cta').innerHTML=c.cta+' <span class="button-spark" aria-hidden="true">✳</span>';$('#story-cta').href=c.id==='keyboard'?'#play':'#collection';$('#chapter-category').textContent=c.category;$('#chapter-number').textContent=String(i+1).padStart(2,'0')+' / 05';$('#caption-kicker').textContent=c.kicker;$('#caption-name').textContent=p.name;$('.story-sticky').style.setProperty('--story-accent',c.accent);$$('[data-chapter]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.chapter)===i);b.setAttribute('aria-current',Number(b.dataset.chapter)===i?'step':'false');});$('.hero-fallback img').src=preview(p);$('.hero-fallback img').alt=p.name;heroRotation.x=0;heroRotation.y=0;}
function updateScroll(){const story=$('#experience'),travel=Math.max(1,story.offsetHeight-$('.story-sticky').offsetHeight);scrollTarget=THREE.MathUtils.clamp((window.scrollY-story.offsetTop)/travel,0,1)*4;$('#story-progress-fill').style.width=(scrollTarget/4*100)+'%';updateChapter(Math.round(scrollTarget));}
function goToChapter(i){const story=$('#experience'),travel=story.offsetHeight-$('.story-sticky').offsetHeight;window.scrollTo({top:story.offsetTop+travel*(i/4),behavior:reduceMotion?'instant':'smooth'});}
window.addEventListener('scroll',updateScroll,{passive:true});window.addEventListener('resize',updateScroll);updateScroll();
new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;},{threshold:0}).observe($('.story-sticky'));
async function startHero(){try{heroStage=makeStage($('#hero-canvas'),{exposure:1.3});const first=await loadModel(getProduct(chapters[0].id));const model=normalizedModel(first);heroModels.set(0,model);heroStage.scene.add(model.group);$('#rotate-label').textContent='Drag to explore';for(let i=1;i<chapters.length;i++){loadModel(getProduct(chapters[i].id)).then(g=>{const m=normalizedModel(g);m.group.visible=false;heroModels.set(i,m);heroStage.scene.add(m.group);}).catch(()=>{});}}catch(e){$('.hero-fallback').hidden=false;$('#hero-drag').hidden=true;$('#rotate-label').textContent='Explore the collection';}}
startHero();

let modalStage=null,modalModel=null,modalToken=0;
const modalRotation={x:.14,y:-.5};const modalCanvas=$('#modal-canvas');modalCanvas.tabIndex=0;modalCanvas.setAttribute('role','img');modalCanvas.setAttribute('aria-label','3D product. Drag or use arrow keys to rotate.');bindRotation(modalCanvas,modalRotation);
async function openProduct(id){const p=getProduct(id);if(!p)throw Error('Unknown product');currentProduct=p;quantity=1;$('#modal-quantity').value='1';$('#modal-title').textContent=p.name;$('#modal-category').textContent=p.category;$('#modal-price').textContent=money(p.price);$('#modal-description').textContent=p.description;$('#modal-finish').textContent=p.finish;$('#modal-swatch').style.background=p.color;$('#modal-features').innerHTML=p.features.map(f=>'<li>'+f+'</li>').join('');$('#modal-index').textContent='OBJECT '+String(catalog.indexOf(p)+1).padStart(2,'0');$('#modal-poster').src=preview(p);$('#modal-poster').alt=p.name;$('#modal-poster').hidden=false;$('#modal-canvas').style.opacity='0';$('#model-status').textContent='Loading your closer look…';showDialog($('#product-dialog'));const token=++modalToken;modalRotation.x=.14;modalRotation.y=-.5;
 try{if(!modalStage)modalStage=makeStage(modalCanvas,{exposure:1.1,background:0xd9dfe7});if(modalModel){modalStage.scene.remove(modalModel.group);modalModel=null;}const gltf=await loadModel(p);if(token!==modalToken||!$('#product-dialog').open)return;modalModel=normalizedModel(gltf,3.3);modalModel.group.rotation.set(.14,-.5,0);modalStage.scene.add(modalModel.group);modalStage.camera.position.z=7.3;modalStage.render();$('#modal-poster').hidden=true;$('#modal-canvas').style.opacity='1';$('#model-status').textContent='';}catch(e){$('#model-status').textContent='3D preview unavailable. Product image shown.';}
}
$('#product-dialog').addEventListener('close',()=>{modalToken++;});

let keyboardStage=null,keyboardModel=null,keyboardMixer=null,keyboardVisible=false,keyboardStarted=false;
async function startKeyboard(){if(keyboardStarted)return;keyboardStarted=true;try{keyboardStage=makeStage($('#keyboard-canvas'),{exposure:1.2});const gltf=await loadModel(getProduct('keyboard'));keyboardModel=normalizedModel(gltf,4.4);keyboardModel.group.rotation.set(.23,-.22,-.04);keyboardStage.scene.add(keyboardModel.group);keyboardStage.camera.position.set(0,3.3,6.2);keyboardStage.camera.lookAt(0,0,0);keyboardMixer=new THREE.AnimationMixer(keyboardModel.content);$('#keyboard-poster').hidden=true;}catch(e){$('#key-feedback').textContent='Explore the TF200 in the collection.';}}
const keyboardObserver=new IntersectionObserver(([entry])=>{keyboardVisible=entry.isIntersecting;if(entry.isIntersecting)startKeyboard();},{rootMargin:'150px'});keyboardObserver.observe($('#play'));
function playKey(code,key){if(!keyboardModel||!keyboardMixer)return;let name=code||key;if(name.startsWith('Key'))name=name.substring(3);if(!code&&/^[a-z]$/i.test(key))name=key.toUpperCase();const clip=keyboardModel.animations.find(a=>a.name==='Press_'+name);if(clip){const action=keyboardMixer.clipAction(clip);action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=false;action.timeScale=1.2;action.play();}$('#key-feedback').textContent='Last key · '+(key===' '?'SPACE':key.toUpperCase());}
$('#keyboard-input').addEventListener('keydown',e=>{if(!e.repeat)playKey(e.code,e.key);});$('#keyboard-input').addEventListener('input',e=>{if(e.inputType==='insertText'&&e.data&&(!e.isComposing))playKey('',e.data.slice(-1));});
let lastTime=0;
function animate(time){requestAnimationFrame(animate);if(document.hidden)return;const delta=Math.min((time-lastTime)/1000,.05);lastTime=time;scrollPosition=reduceMotion?scrollTarget:THREE.MathUtils.lerp(scrollPosition,scrollTarget,Math.min(1,delta*9));
 if(heroStage&&heroVisible){const mobile=window.innerWidth<=800,short=window.innerHeight<740;const centerX=mobile?.08:Math.max(1.55,heroStage.camera.aspect*1.05);const centerY=mobile?-1.03:0;heroModels.forEach((m,i)=>{const d=(reduceMotion?Math.round(scrollPosition):scrollPosition)-i,abs=Math.abs(d);m.group.visible=abs<.94;if(!m.group.visible)return;const size=(mobile?(short?.45:.58):1)*(1-abs*.34);m.group.scale.setScalar(size);m.group.position.set(centerX+Math.sin(d*Math.PI/2)*(mobile?3.9:5),centerY-abs*.2+(reduceMotion?0:Math.sin(time*.00075+i)*.055),-abs*1.2);m.group.rotation.set(.13+heroRotation.x,-.55+d*1.05+heroRotation.y+(reduceMotion?0:Math.sin(time*.0003)*.035),abs*.08);});heroStage.render();const target=Math.round(scrollPosition);$('.hero-fallback').hidden=heroModels.has(target);}
 if(modalStage&&modalModel&&$('#product-dialog').open){modalModel.group.rotation.set(modalRotation.x,modalRotation.y,0);modalStage.render();}
 if(keyboardStage&&keyboardModel&&keyboardVisible){keyboardMixer?.update(delta);if(!reduceMotion)keyboardModel.group.position.y=Math.sin(time*.00055)*.04;keyboardStage.render();}
}
requestAnimationFrame(animate);

// The same catalog and bag actions are available to supporting agent browsers.
const context=document.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'list_products',title:'Browse Deal Drip products',description:'Read the product catalog and sample prices for this storefront concept.',inputSchema:{type:'object',properties:{category:{type:'string',enum:['All','Audio','Gaming','Everyday']}},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input?.category&&!['All','Audio','Gaming','Everyday'].includes(input.category))throw Error('Invalid category');return catalog.filter(p=>!input?.category||input.category==='All'||p.category===input.category).map(({id,name,category,price})=>({id,name,category,price,currency:'NPR'}));}});
 register({name:'add_products_to_bag',title:'Add products to bag',description:'Add selected products and quantities to the visible shopping bag. Does not purchase or submit an order.',inputSchema:{type:'object',properties:{items:{type:'array',minItems:1,maxItems:20,items:{type:'object',properties:{productId:{type:'string'},quantity:{type:'integer',minimum:1,maximum:99}},required:['productId','quantity'],additionalProperties:false}}},required:['items'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Array.isArray(input.items)||!input.items.length||input.items.length>20||input.items.some(x=>!getProduct(x.productId)||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>99))throw Error('Invalid products or quantities');input.items.forEach(x=>addToBag(x.productId,x.quantity));showDialog($('#bag-dialog'));return{items:[...bag].map(([id,quantity])=>({id,quantity})),total:bagTotal(),currency:'NPR',orderSubmitted:false};}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
