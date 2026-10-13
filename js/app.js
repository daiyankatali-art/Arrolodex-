// ===== THE ARRAYS (parallel: same index = same contact) =====
var names  = [];     // names[i]  -> contact name
var phones = [];     // phones[i] -> digits only, with country code (e.g. "2348012345678")
var openIdx = -1;    // which contact's dropdown is open (-1 = none)
var $ = function(id){ return document.getElementById(id); };

function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function color(n){ var h=0; for(var i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))%360; return "hsl("+h+",55%,45%)"; }
function say(t,bad){ var m=$("msg"); m.textContent=t; m.className="note"+(bad?" err":""); }

// ===== SAVE / LOAD =====
function save(){ try{ localStorage.setItem("arrolodex", JSON.stringify({n:names,p:phones})); }catch(e){} }
function load(){
  try{
    var d=JSON.parse(localStorage.getItem("arrolodex"));
    if(d && Array.isArray(d.n) && Array.isArray(d.p) && d.n.length===d.p.length){ names=d.n; phones=d.p; }
  }catch(e){}
}

// ===== ARRAY OPERATIONS =====
function addContact(){
  var name=$("fName").value.trim(), raw=$("fPhone").value.trim();
  var digits=raw.replace(/\D/g,"");
  if(digits.indexOf("00")===0) digits=digits.slice(2);            // 00234... -> 234...
  if(!name){ say("Enter a name.",true); return; }
  if(digits.charAt(0)==="0"){ say("Start with the country code, e.g. +234 (not 0).",true); return; }
  if(digits.length<8 || digits.length>15){ say("Enter a valid number with country code.",true); return; }
  if(phones.indexOf(digits)!==-1){ say("That number is already saved.",true); return; }   // search the array

  var pos=0;                                                      // find the A-Z position
  while(pos<names.length && names[pos].toLowerCase()<=name.toLowerCase()) pos++;
  names.splice(pos,0,name);                                       // insert into BOTH arrays
  phones.splice(pos,0,digits);

  openIdx=-1; save();
  $("fName").value=""; $("fPhone").value="";
  say("Saved "+name+".");
  draw();
}
function removeContact(i){
  names.splice(i,1); phones.splice(i,1);                          // later items shift left
  openIdx=-1; save(); draw();
}

// ===== DRAWING =====
function draw(){
  var q=$("search").value.trim().toLowerCase(), h="", shown=0;
  for(var i=0;i<names.length;i++){                                // one container per array slot
    if(q && names[i].toLowerCase().indexOf(q)===-1 && phones[i].indexOf(q.replace(/\D/g,"")||"\u0000")===-1) continue;
    shown++;
    var open=(i===openIdx);
    h+='<div class="contact'+(open?" open":"")+'">'+
       '<div class="head" data-head="'+i+'">'+
         '<div class="av" style="background:'+color(names[i])+'">'+esc(names[i].charAt(0).toUpperCase())+'</div>'+
         '<div class="info"><b>'+esc(names[i])+'</b><small>+'+esc(phones[i])+'</small></div>'+
         '<span class="chev">'+(open?"▲":"▼")+'</span>'+
       '</div>';
    if(open){                                                     // the temporary dropdown
      h+='<div class="menu">'+
         '<a class="opt wa" href="https://wa.me/'+phones[i]+'" target="_blank" rel="noopener">💬 Message on WhatsApp</a>'+
         '<a class="opt" href="tel:+'+phones[i]+'">📞 Call</a>'+
         '<button class="opt del" data-del="'+i+'">🗑 Delete contact</button>'+
         '</div>';
    }
    h+='</div>';
  }
  $("list").innerHTML = h || '<p class="note">'+(names.length?"No contacts match.":"No contacts yet. Add one above.")+'</p>';
  $("cnt").textContent="("+names.length+")";
  $("code").textContent=
    "names  = ["+names.slice(0,5).map(function(x){return '"'+x+'"';}).join(", ")+(names.length>5?", ...":"")+"]\n"+
    "phones = ["+phones.slice(0,5).map(function(x){return '"'+x+'"';}).join(", ")+(names.length>5?", ...":"")+"]\n"+
    "length = "+names.length+(openIdx>=0?"\nopen   = index "+openIdx+"  ->  "+names[openIdx]+" / "+phones[openIdx]:"");
}

// ===== EVENTS =====
$("list").addEventListener("click",function(e){
  var del=e.target.closest("[data-del]");
  if(del){ removeContact(parseInt(del.getAttribute("data-del"),10)); return; }
  if(e.target.closest(".opt")) return;                            // let WhatsApp / Call links work
  var head=e.target.closest("[data-head]");
  if(head){
    var i=parseInt(head.getAttribute("data-head"),10);
    openIdx=(openIdx===i)?-1:i;                                   // toggle dropdown
    draw();
  }
});
document.addEventListener("click",function(e){                    // click outside closes it
  if(openIdx>=0 && !e.target.closest(".contact")){ openIdx=-1; draw(); }
});
$("bAdd").onclick=addContact;
$("search").addEventListener("input",draw);

load(); draw();
