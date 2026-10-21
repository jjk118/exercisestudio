const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
for(const name of ['LegStrengthBalance','kneesupportstrength']){
 const s=fs.readFileSync(path.join(__dirname,'..',name+'.html'),'utf8');const engine=s.split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];const c={document:{createElement:()=>({width:360,height:230,getContext:()=>null})},window:{devicePixelRatio:1},performance:{now:()=>0},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{}};vm.createContext(c);
 // Skip generation of static thumbnail pictures; exercise scene definitions and renderer are evaluated unchanged.
 const clean=engine.replace(/var THUMBS = \{\};[\s\S]*?(?=function poseAt)/,'');
 try{vm.runInContext(clean,c);}catch(e){console.error(name,e);throw e;}
 let samples=0;
 for(const [id,sc] of Object.entries(c.SCENES))for(let i=0;i<21;i++)for(const side of [true,false]){
 const st=c.poseAt(sc,sc.total*i/21),k=c.legacyRig(st.pose,sc,side),o=new c.Ops();c.glFigure(o,k,{lat:k.lat});sc.glProps(o);
 for(const item of o.list){assert([...item.M,...item.NM,...item.col].every(Number.isFinite),name+' '+id+' finite geometry');}
 samples++;
 }
 for(const view of ['25','0','80'])assert(s.includes('data-view="'+view+'"'));
 console.log('PASS '+name+': '+samples+' body/prop geometry samples, both sides, all view controls.');
}
