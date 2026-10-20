const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
function extract(s,name){const a=s.indexOf('function '+name+'('),body=s.indexOf('{',a);assert(a>=0,name);for(let end=body+1;end<s.length;end++){if(s[end]!=='}')continue;const code=s.slice(a,end+1);try{new vm.Script('('+code+')');return code;}catch{}}throw Error(name);}
for(const name of ['balance-stability','lower-body-strength','flexibility-joint-mobility','walking-endurance-gait']){
 const s=fs.readFileSync(path.join(__dirname,'..',name+'.html'),'utf8');
 const exercises=JSON.parse(s.match(/var EXERCISES = ([\s\S]*?\n\]);/)[1]),presets=JSON.parse(s.match(/var FOUR_WEEK_PRESETS = (.*);/)[1]);
 const rest=+s.match(/var BETWEEN_DEFAULT = (\d+)/)[1];let saves=0,holds=0,renders=0;
 const history={day:['existing']},elements={};
 const c={EXERCISES:exercises,FOUR_WEEK_PRESETS:presets,BETWEEN_DEFAULT:rest,todayStr:()=>'',isTimed:e=>!!e.timed,$:id=>elements[id]||(elements[id]={}),applyHolds:()=>holds++,save:()=>saves++,renderSettings:()=>renders++};vm.createContext(c);
 vm.runInContext(extract(s,'defaults')+'\n'+extract(s,'limits')+'\n'+extract(s,'applyTrainingWeek'),c);c.S=c.defaults();c.S.history=history;
 const initialEnabled=JSON.stringify(c.S.enabled);
 for(const e of exercises)for(const k of ['sets','reps','hold','rest','repRest'])assert.equal(c.S[k][e.id],presets[0][e.id][k],name+' week 1 defaults '+k);
 for(let w=1;w<=4;w++){c.applyTrainingWeek(w);assert.equal(c.S.history,history);assert.equal(JSON.stringify(c.S.enabled),initialEnabled);assert.equal(c.S.exerciseSpeed,1);assert.equal(c.S.between,rest);
 for(const e of exercises)for(const k of ['sets','reps','hold','rest','repRest']){const val=c.S[k][e.id];assert.equal(val,presets[w-1][e.id][k]);if(k==='hold'&&!e.hold)continue;const [min,max]=c.limits(e,k);assert(val>=min&&val<=max,name+' '+e.id+' '+k);}
 }
 assert.equal(saves,4);assert.equal(holds,4);assert.equal(renders,4);if(name==='walking-endurance-gait'){assert(c.S.enabled.marchseated);assert.equal(c.S.enabled.marchstanding,false);}
 console.log('PASS '+name+': four presets within limits; week 1 defaults; exercise selections/history preserved; saved and estimates refreshed.');
}
