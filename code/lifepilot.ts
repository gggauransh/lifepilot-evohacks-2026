export type Category = 'Personal' | 'Work' | 'Family' | 'Study' | 'Travel';
export type Action = { id: string; title: string; due: string | null; time: string | null; minutes: number; priority: 'High' | 'Medium' | 'Low'; category: Category; source: string; quote: string; notes: string; steps: string[]; done: boolean; demo: boolean; created: string };
export type Extracted = Pick<Action, 'title' | 'due' | 'time' | 'minutes' | 'priority' | 'category' | 'quote' | 'notes' | 'steps'>;
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function offsetDay(n: number, base = new Date()) { const d = new Date(base); d.setDate(d.getDate()+n); return localDay(d); }
export function seedActions(): Action[] {
 const examples: Extracted[] = [
  { title:'Pay electricity bill', due:offsetDay(2), time:null, minutes:5, priority:'High',category:'Personal',quote:`Electricity bill: AED 620. Payment due ${offsetDay(2)}.`,notes:'AED 620 · Check the amount and payment details on your original bill.',steps:['Check bill details','Pay through your usual provider','Save the payment confirmation'] },
  { title:'Confirm dentist appointment',due:offsetDay(4),time:'16:00',minutes:5,priority:'Medium',category:'Personal',quote:`Your dentist appointment is ${offsetDay(4)} at 4 PM. Please confirm.`,notes:'Call or reply to the clinic to confirm the appointment.',steps:['Check the appointment time','Contact the clinic to confirm'] },
  { title:'Send the project update',due:offsetDay(0),time:null,minutes:20,priority:'High',category:'Work',quote:'Please send a short project update today with progress and next steps.',notes:'A short update keeps everyone on the same page.',steps:['List what is complete','Add blockers and next steps','Review and send the update'] },
  { title:'Return the school permission slip',due:offsetDay(3),time:null,minutes:10,priority:'Medium',category:'Family',quote:`Please sign and return the trip permission slip by ${offsetDay(3)}.`,notes:'Review the trip details before signing.',steps:['Read the trip details','Sign the slip','Return it to the school'] }
 ];
 return examples.map((a,i)=>({...a,id:`demo-${i}`,source:['Electricity bill','Clinic message','Work email','School notice'][i],done:false,demo:true,created:new Date().toISOString()}));
}
export function compareActions(a: Action,b: Action) { const rank={High:0,Medium:1,Low:2};return (a.due??'9999').localeCompare(b.due??'9999') || rank[a.priority]-rank[b.priority]; }
export function dueLabel(due:string|null,today=localDay()) { if(!due)return 'No date · review';if(due===today)return 'Today';if(due===offsetDay(1,new Date(today+'T12:00:00')))return 'Tomorrow';return new Date(due+'T12:00:00').toLocaleDateString('en',{month:'short',day:'numeric'}); }
export function isOverdue(a:Action){return !!a.due&&a.due<localDay()&&!a.done;}
// Rule-based text helper. Never labelled AI; unknown dates remain empty.
export function extractText(text:string,reference=localDay()): Extracted[] {
 const base=new Date(reference+'T12:00:00');
 const lines=text.split(/\n+|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
 const actions:Extracted[]=[];
 for(const line of lines.slice(0,60)) {
  if(!/\b(pay|payment|due|submit|send|complete|finish|confirm|appointment|renew|return|bring|sign|book|call|reply|review|deadline|expires?|upload|attend|prepare|check)\b/i.test(line))continue;
  let due:string|null=null;
  const iso=line.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if(iso&&validDate(iso[1]))due=iso[1];
  else if(/\btomorrow\b/i.test(line))due=offsetDay(1,base);
  else if(/\btoday\b/i.test(line))due=reference;
  else {
   const month=line.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i);
   if(month) {const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];const year=Number(month[3]??base.getFullYear());const m=months.indexOf(month[1].slice(0,3).toLowerCase());const d=`${year}-${String(m+1).padStart(2,'0')}-${month[2].padStart(2,'0')}`;if(validDate(d))due=d;}
   else {const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const found=weekdays.findIndex(day=>new RegExp('\\b'+day+'\\b','i').test(line));if(found>=0)due=offsetDay((found-base.getDay()+7)%7||7,base);}
  }
  const tm=line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);let time:string|null=null;
  if(tm){const h=Number(tm[1]),m=Number(tm[2]??0);if(h>=1&&h<=12&&m<60)time=`${String(h%12+(tm[3].toLowerCase()==='pm'?12:0)).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
  const category:Category=/school|permission|child/i.test(line)?'Family':/assignment|homework|exam|study|science project/i.test(line)?'Study':/visa|flight|passport|travel/i.test(line)?'Travel':/project|boss|client|meeting|report|work/i.test(line)?'Work':'Personal';
  const title=line.replace(/^(dear\s+\w+[,!]\s*|please\s+|reminder:\s*)/i,'').slice(0,120);
  actions.push({title:title[0].toUpperCase()+title.slice(1),due,time,minutes:/pay|confirm|reply/i.test(line)?5:20,priority:due&&due<=offsetDay(2,base)?'High':'Medium',category,quote:line,notes:'Text helper suggestion. Review the wording, date, and estimated time before saving.',steps:['Review the original message','Complete the requested action']});
 }
 return actions.slice(0,20);
}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+'T12:00:00').getTime())&&localDay(new Date(s+'T12:00:00'))===s;}
export function calendar(actions:Action[]) {
 const esc=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LifePilot//Action Plan//EN','CALSCALE:GREGORIAN'];
 for(const a of actions.filter(a=>a.due&&!a.done)) {
  lines.push('BEGIN:VEVENT',`UID:${a.id}@lifepilot`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`SUMMARY:${esc(a.title)}`,`DESCRIPTION:${esc(a.notes+'\nSource: '+a.source)}`);
  if(a.time) {const start=new Date(a.due+'T'+a.time+':00');const end=new Date(start.getTime()+a.minutes*60000);const fmt=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');lines.push(`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`);}
  else {lines.push(`DTSTART;VALUE=DATE:${a.due!.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${offsetDay(1,new Date(a.due+'T12:00:00')).replace(/-/g,'')}`);}
  lines.push('END:VEVENT');
 }
 return [...lines,'END:VCALENDAR',''].join('\r\n');
}
export function planDay(actions:Action[],budget:number){const selected:Action[]=[];let used=0;for(const a of actions.filter(a=>!a.done).sort(compareActions)){if(used+a.minutes<=budget){selected.push(a);used+=a.minutes;}}return {selected,used};}
