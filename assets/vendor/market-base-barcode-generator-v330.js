/* MARKET BASE barcode generator. Code 128/39 pattern tables adapted from ReportLab (BSD). */
(function(global){
  'use strict';
  const C128=["BaBbBb","BbBaBb","BbBbBa","AbAbBc","AbAcBb","AcAbBb","AbBbAc","AbBcAb","AcBbAb","BbAbAc","BbAcAb","BcAbAb","AaBbCb","AbBaCb","AbBbCa","AaCbBb","AbCaBb","AbCbBa","BbCbAa","BbAaCb","BbAbCa","BaCbAb","BbCaAb","CaBaCa","CaAbBb","CbAaBb","CbAbBa","CaBbAb","CbBaAb","CbBbAa","BaBaBc","BaBcBa","BcBaBa","AaAcBc","AcAaBc","AcAcBa","AaBcAc","AcBaAc","AcBcAa","BaAcAc","BcAaAc","BcAcAa","AaBaCc","AaBcCa","AcBaCa","AaCaBc","AaCcBa","AcCaBa","CaCaBa","BaAcCa","BcAaCa","BaCaAc","BaCcAa","BaCaCa","CaAaBc","CaAcBa","CcAaBa","CaBaAc","CaBcAa","CcBaAa","CaDaAa","BbAdAa","DcAaAa","AaAbBd","AaAdBb","AbAaBd","AbAdBa","AdAaBb","AdAbBa","AaBbAd","AaBdAb","AbBaAd","AbBdAa","AdBaAb","AdBbAa","BdAbAa","BbAaAd","DaCaAa","BdAaAb","AcDaAa","AaAbDb","AbAaDb","AbAbDa","AaDbAb","AbDaAb","AbDbAa","DaAbAb","DbAaAb","DbAbAa","BaBaDa","BaDaBa","DaBaBa","AaAaDc","AaAcDa","AcAaDa","AaDaAc","AaDcAa","DaAaAc","DaAcAa","AaCaDa","AaDaCa","CaAaDa","DaAaCa","BaAdAb","BaAbAd","BaAbCb","BcCaAaB"];
  const C39={"0":"bsbSBsBsb","1":"BsbSbsbsB","2":"bsBSbsbsB","3":"BsBSbsbsb","4":"bsbSBsbsB","5":"BsbSBsbsb","6":"bsBSBsbsb","7":"bsbSbsBsB","8":"BsbSbsBsb","9":"bsBSbsBsb","A":"BsbsbSbsB","B":"bsBsbSbsB","C":"BsBsbSbsb","D":"bsbsBSbsB","E":"BsbsBSbsb","F":"bsBsBSbsb","G":"bsbsbSBsB","H":"BsbsbSBsb","I":"bsBsbSBsb","J":"bsbsBSBsb","K":"BsbsbsbSB","L":"bsBsbsbSB","M":"BsBsbsbSb","N":"bsbsBsbSB","O":"BsbsBsbSb","P":"bsBsBsbSb","Q":"bsbsbsBSB","R":"BsbsbsBSb","S":"bsBsbsBSb","T":"bsbsBsBSb","U":"BSbsbsbsB","V":"bSBsbsbsB","W":"BSBsbsbsb","X":"bSbsBsbsB","Y":"BSbsBsbsb","Z":"bSBsBsbsb","-":"bSbsbsBsB",".":"BSbsbsBsb"," ":"bSBsbsBsb","*":"bSbsBsBsb","$":"bSbSbSbsb","/":"bSbSbsbSb","+":"bSbsbSbSb","%":"bsbSbSbSb"};
  const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R=['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const PARITY=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  const ITF=['nnwwn','wnnnw','nwnnw','wwnnn','nnwnw','wnwnn','nwwnn','nnnww','wnnwn','nwnwn'];
  function checksum(digits){
    let sum=0, weight=3;
    for(let i=digits.length-1;i>=0;i--){sum+=Number(digits[i])*weight;weight=weight===3?1:3;}
    return String((10-(sum%10))%10);
  }
  function normalizeFixed(value,bodyLength,label){
    let digits=String(value||'').replace(/\D/g,'');
    if(digits.length===bodyLength) digits+=checksum(digits);
    if(digits.length!==bodyLength+1) throw new Error(label+'は'+bodyLength+'桁（チェック数字なし）または'+(bodyLength+1)+'桁で入力してください。');
    if(checksum(digits.slice(0,-1))!==digits.slice(-1)) throw new Error(label+'のチェック数字が正しくありません。');
    return digits;
  }
  function encodeEAN13(value){
    const d=normalizeFixed(value,12,'JAN-13 / EAN-13');
    let bits='101', p=PARITY[Number(d[0])];
    for(let i=1;i<=6;i++) bits+=(p[i-1]==='L'?L:G)[Number(d[i])];
    bits+='01010'; for(let i=7;i<13;i++) bits+=R[Number(d[i])];
    return {bits:bits+'101',text:d};
  }
  function encodeEAN8(value){
    const d=normalizeFixed(value,7,'JAN-8 / EAN-8');
    let bits='101'; for(let i=0;i<4;i++) bits+=L[Number(d[i])];
    bits+='01010'; for(let i=4;i<8;i++) bits+=R[Number(d[i])];
    return {bits:bits+'101',text:d};
  }
  function encodeUPCA(value){
    const d=normalizeFixed(value,11,'UPC-A');
    const encoded=encodeEAN13('0'+d);
    return {bits:encoded.bits,text:d};
  }
  function patternToBits(pattern,kind){
    let bits='';
    for(const ch of pattern){
      if(kind==='128'){const width=ch.toLowerCase().charCodeAt(0)-96;bits+=(ch===ch.toUpperCase()?'1':'0').repeat(width);}
      else {const wide=ch===ch.toUpperCase();const bar=ch.toLowerCase()==='b';bits+=(bar?'1':'0').repeat(wide?3:1);}
    }
    return bits;
  }
  function encodeCode128(value){
    const input=String(value??''); if(!input) throw new Error('Code128の内容を入力してください。');
    let codes=[];
    if(/^\d+$/.test(input)&&input.length%2===0){codes=[105];for(let i=0;i<input.length;i+=2)codes.push(Number(input.slice(i,i+2)));}
    else {
      if([...input].some(ch=>{const n=ch.charCodeAt(0);return n<32||n>126;})) throw new Error('Code128は半角英数字・記号で入力してください。');
      codes=[104,...[...input].map(ch=>ch.charCodeAt(0)-32)];
    }
    let check=codes[0]; for(let i=1;i<codes.length;i++) check+=codes[i]*i;
    codes.push(check%103,106);
    return {bits:'0000000000'+codes.map(n=>patternToBits(C128[n],'128')).join('')+'0000000000',text:input};
  }
  function encodeCode39(value){
    let input=String(value??'').trim().toUpperCase();
    if(!input) throw new Error('Code39の内容を入力してください。');
    if([...input].some(ch=>!C39[ch])) throw new Error('Code39は半角英数字と - . 空白 $ / + % のみ対応します。');
    const chars='*'+input+'*';
    return {bits:'0000000000'+[...chars].map(ch=>patternToBits(C39[ch],'39')).join('0')+'0000000000',text:input};
  }
  function encodeITF(value){
    const input=String(value||'').replace(/\s/g,'');
    if(!/^\d+$/.test(input)||input.length%2) throw new Error('ITFは偶数桁の数字で入力してください。');
    let bits='1010';
    for(let i=0;i<input.length;i+=2){const a=ITF[Number(input[i])],b=ITF[Number(input[i+1])];for(let j=0;j<5;j++)bits+='1'.repeat(a[j]==='w'?3:1)+'0'.repeat(b[j]==='w'?3:1);}
    return {bits:'0000000000'+bits+'11101'+'0000000000',text:input};
  }
  function encode(format,value){
    switch(String(format).toUpperCase()){
      case 'EAN13': case 'JAN13': return encodeEAN13(value);
      case 'EAN8': case 'JAN8': return encodeEAN8(value);
      case 'UPCA': case 'UPC': return encodeUPCA(value);
      case 'CODE39': return encodeCode39(value);
      case 'ITF': return encodeITF(value);
      case 'CODE128': default: return encodeCode128(value);
    }
  }
  function render(canvas,format,value,options){
    options=options||{}; const data=encode(format,value); const bits=data.bits;
    const ratio=Math.max(1,Math.min(3,global.devicePixelRatio||1));
    const module=Math.max(1,Number(options.moduleWidth||2)); const barHeight=Math.max(80,Number(options.height||150));
    const textHeight=options.displayValue===false?0:34; const width=bits.length*module; const height=barHeight+textHeight;
    canvas.width=width*ratio; canvas.height=height*ratio; canvas.style.width='min(100%,'+width+'px)'; canvas.style.height='auto';
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle=options.background||'#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=options.foreground||'#071f43';
    for(let i=0;i<bits.length;i++)if(bits[i]==='1')ctx.fillRect(i*module,0,module,barHeight);
    if(textHeight){ctx.font='700 18px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(data.text,width/2,barHeight+textHeight/2);}
    return {canvas,text:data.text,bits};
  }
  global.MarketBaseBarcode=Object.freeze({encode,render,checksum,license:'BSD pattern tables'});
})(window);
