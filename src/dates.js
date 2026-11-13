export function today(now=new Date()) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function validDate(y,m,d) { const dt=new Date(Date.UTC(+y,+m-1,+d)); return +y>=2000 && +y<=2199 && dt.getUTCFullYear()===+y && dt.getUTCMonth()===+m-1 && dt.getUTCDate()===+d; }
export function iso(y,m,d){return validDate(y,m,d)?`${y}-${String(+m).padStart(2,'0')}-${String(+d).padStart(2,'0')}`:null;}
// No year inference: yearless candidates must be confirmed using an explicit year.
export function candidates(text) {
 const s=text.normalize('NFKC'); const out=new Map();
 const add=(raw,y,m,d)=>{if(y && +y<1911)y=+y+1911;if(y?!validDate(y,m,d):!(+m>=1&&+m<=12&&+d>=1&&+d<=31))return; const key=`${y||'?'}-${+m}-${+d}`;out.set(key,{raw,year:y?+y:null,month:+m,day:+d});};
 const full=/(\d{4}|\d{3})\s*(?:[.\/-]|年)\s*(\d{1,2})\s*(?:[.\/-]|月)\s*(\d{1,2})(?:日)?/g;
 let r; let masked=s; while((r=full.exec(s))){add(r[0],r[1],r[2],r[3]);masked=masked.replace(r[0],' '.repeat(r[0].length));}
 masked=masked.replace(/(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)/g,(raw,y,m,d)=>{add(raw,y,m,d);return ' '.repeat(raw.length);});
 masked=masked.replace(/(?<!\d)(\d{2})[.\/-](\d{2})[.\/-](\d{2})(?!\d)/g,(raw,a,b,c)=>{add(raw+'（年/月/日，請確認年份）',null,b,c);add(raw+'（月/日/年，請確認年份）',null,a,b);return ' '.repeat(raw.length);});
 const partial=/(?<!\d)(\d{1,2})\s*(?:[.\/-]|月)\s*(\d{1,2})(?:日)?(?!\d)/g;
 while((r=partial.exec(masked)))add(r[0],null,r[1],r[2]); return [...out.values()];
}
export function calendar(items){let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Expiry V3//TW//ZH','CALSCALE:GREGORIAN'];for(const p of items){const date=p.expiry.replaceAll('-','');const escape=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');lines.push('BEGIN:VEVENT',`UID:${p.id}@expiry-v3`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${new Date(p.expiry+'T00:05:00+08:00').toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`SUMMARY:${escape('下架：'+(p.name||'未命名商品'))}`,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:今日商品下架','TRIGGER:PT0S','END:VALARM','END:VEVENT');}lines.push('END:VCALENDAR');return lines.map(line=>{let n=0,out='';for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(n+bytes>75){out+='\r\n ';n=1;}out+=ch;n+=bytes;}return out;}).join('\r\n')+'\r\n';}
