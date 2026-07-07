import {initializeApp} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {getFirestore,collection,addDoc,onSnapshot,doc,updateDoc,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyDsRu7HzIl2_u334EfTrOCPqaIlphgXtZw",authDomain:"nijigaku-tanabata.firebaseapp.com",projectId:"nijigaku-tanabata",storageBucket:"nijigaku-tanabata.firebasestorage.app",messagingSenderId:"959354845309",appId:"1:959354845309:web:109ac828f5a9631f89d914",measurementId:"G-7M0L137SGH"};
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const wishesRef=collection(db,"activityWishes");
const carousel=document.querySelector("#carousel");
const totalLikes=document.querySelector("#totalLikes");
const form=document.querySelector("#wishForm");
const status=document.querySelector("#status");
const prevButton=document.querySelector("#prev");
const nextButton=document.querySelector("#next");
let wishes=[],sortMode="new",currentIndex=0,scrollTimer=null;

function likedKey(id){return `tanabata-activity-liked-${id}`}
function escapeHtml(value=""){const div=document.createElement("div");div.textContent=value;return div.innerHTML}
function getSortedWishes(){return [...wishes].sort((a,b)=>sortMode==="likes"?(b.likes||0)-(a.likes||0):(b.createdMs||0)-(a.createdMs||0))}
function scrollToCurrent(smooth=true){const cards=carousel.querySelectorAll(".wish-card");if(!cards.length||!cards[currentIndex])return;cards[currentIndex].scrollIntoView({behavior:smooth?"smooth":"auto",inline:"center",block:"nearest"})}
function render(){
 const data=getSortedWishes();
 totalLikes.textContent=wishes.reduce((n,w)=>n+(w.likes||0),0).toLocaleString("ja-JP");
 if(!data.length){carousel.innerHTML='<div class="empty">まだ願いごとがありません。<br>最初の短冊を書いてみよう。</div>';return}
 if(currentIndex>=data.length)currentIndex=0;
 carousel.innerHTML=data.map(w=>{
  const liked=localStorage.getItem(likedKey(w.id))==="1";
  return `<article class="wish-card"><h3>${escapeHtml(w.name||"")}</h3><span class="grade">${escapeHtml(w.grade||"")}</span><div class="wish-text">${escapeHtml(w.wish||"").trim()}</div><button class="like ${liked?"liked":""}" data-id="${w.id}" ${liked?"disabled":""}>♥ ${w.likes||0}</button></article>`
 }).join("");
 requestAnimationFrame(()=>scrollToCurrent(false))
}
function goNext(){const data=getSortedWishes();if(!data.length)return;currentIndex=(currentIndex+1)%data.length;scrollToCurrent(true)}
function goPrev(){const data=getSortedWishes();if(!data.length)return;currentIndex=(currentIndex-1+data.length)%data.length;scrollToCurrent(true)}

carousel.addEventListener("scroll",()=>{
 clearTimeout(scrollTimer);
 scrollTimer=setTimeout(()=>{
  const cards=[...carousel.querySelectorAll(".wish-card")];if(!cards.length)return;
  const center=carousel.scrollLeft+carousel.clientWidth/2;
  let closest=0,distance=Infinity;
  cards.forEach((card,index)=>{const d=Math.abs(center-(card.offsetLeft+card.offsetWidth/2));if(d<distance){distance=d;closest=index}});
  currentIndex=closest;
  if(currentIndex===cards.length-1&&carousel.scrollLeft+carousel.clientWidth>=carousel.scrollWidth-5){setTimeout(()=>{currentIndex=0;scrollToCurrent(false)},250)}
 },150)
});

onSnapshot(wishesRef,snapshot=>{
 wishes=snapshot.docs.map(document=>{const data=document.data();return{id:document.id,...data,createdMs:data.createdAt?.toMillis?.()||0}});
 render()
},error=>{console.error(error);carousel.innerHTML=`<div class="empty">Firebaseへの接続に失敗しました。<br>${escapeHtml(error.message)}</div>`});

carousel.addEventListener("click",async event=>{
 const button=event.target.closest(".like");if(!button||button.disabled)return;
 const id=button.dataset.id;button.disabled=true;localStorage.setItem(likedKey(id),"1");
 try{await updateDoc(doc(db,"activityWishes",id),{likes:increment(1)})}
 catch(error){localStorage.removeItem(likedKey(id));button.disabled=false;alert("いいねに失敗しました")}
});

form.addEventListener("submit",async event=>{
 event.preventDefault();
 const name=document.querySelector("#name").value.trim();
 const grade=document.querySelector("#grade").value;
 const wish=document.querySelector("#wish").value.trim();
 if(!name||!grade||!wish){status.textContent="すべて入力してください。";return}
 status.textContent="投稿中…";
 try{await addDoc(wishesRef,{name,grade,wish,likes:0,createdAt:serverTimestamp()});form.reset();currentIndex=0;status.textContent="願いごとを投稿しました ✨"}
 catch(error){console.error(error);status.textContent=`投稿できませんでした：${error.message}`}
});

document.querySelectorAll(".sort button").forEach(button=>button.addEventListener("click",()=>{
 document.querySelectorAll(".sort button").forEach(item=>item.classList.remove("active"));
 button.classList.add("active");sortMode=button.dataset.sort;currentIndex=0;render()
}));
prevButton?.addEventListener("click",goPrev);
nextButton?.addEventListener("click",goNext);
