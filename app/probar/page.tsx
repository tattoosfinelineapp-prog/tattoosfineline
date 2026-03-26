'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ProbadorContent() {
  const searchParams = useSearchParams()
  const designUrl = searchParams.get('design')

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @font-face{font-family:"Magenta";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Magenta%20Regular.woff2")format("woff2")}
      @font-face{font-family:"Roslyna";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Roslyna%20Regular.woff2")format("woff2")}
      @font-face{font-family:"RetroSignature";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Retro%20Signature%20Regular.woff2")format("woff2")}
      @font-face{font-family:"JeeWish";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Jee%20Wish%20Demo%20Version%20Regular.woff2")format("woff2")}
      @font-face{font-family:"Botterill";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Botterill%20Signature%20Regular.woff2")format("woff2")}
      @font-face{font-family:"Halimun";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Halimun%20Regular.woff2")format("woff2")}
      @font-face{font-family:"ShoppingScript";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Shopping%20Script%20Demo%20Regular.woff2")format("woff2")}
      @font-face{font-family:"MiltonOne";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Milton%20One%20Regular.woff2")format("woff2")}
      @font-face{font-family:"CherryHand";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Cherry%20Hand%20Regular.woff2")format("woff2")}
      @font-face{font-family:"FreshFlower";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/FRESH%20FLOWERS%20Regular.woff2")format("woff2")}
      @font-face{font-family:"SimpleRegular";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Simple%20Regular.woff2")format("woff2")}
      @font-face{font-family:"Bookish";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Bookish%20Regular.woff2")format("woff2")}
      @font-face{font-family:"Simplicity";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Simplicity%20Medium.woff2")format("woff2")}
      @font-face{font-family:"SnellRegular";src:url("https://assets.zyrosite.com/YD0l7ZR1RWuv09vY/Snell%20Regular.woff2")format("woff2")}
      .tt-section{display:none}
      .tt-section.visible{display:block}
      .choice-btn{display:flex;align-items:center;gap:18px;width:100%;padding:20px 4px;background:none;border:none;border-bottom:1px solid #e2e2e2;cursor:pointer;text-align:left}
      .choice-btn:first-child{border-top:1px solid #e2e2e2}
      .choice-btn:hover{background:#f7f7f5}
      .choice-num{font-size:11px;color:#888;min-width:22px}
      .choice-title{font-size:17px;font-weight:400;display:block}
      .choice-sub{font-size:12px;color:#888;margin-top:3px;display:block}
      .choice-arrow{font-size:15px;color:#888;transition:transform .2s}
      .choice-btn:hover .choice-arrow{transform:translateX(4px);color:#111}
      .btn-primary{background:#111;color:#fff;border:none;border-radius:999px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s}
      .btn-primary:hover{opacity:.8}
      .btn-primary:disabled{opacity:.45;cursor:default}
      .btn-ghost{background:none;color:#111;border:1px solid #e2e2e2;border-radius:999px;padding:9px 18px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
      .btn-ghost:hover{background:#f2f2f0}
      .back-btn{width:34px;height:34px;border-radius:50%;border:1px solid #e2e2e2;background:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
      .back-btn:hover{background:#f2f2f0}
      .input-row{display:flex;gap:10px;align-items:stretch;margin-bottom:18px}
      .input-row textarea{flex:1;padding:12px 14px;border:1px solid #e2e2e2;border-radius:14px;font-size:15px;outline:none;resize:none;min-height:48px}
      .input-row textarea:focus{border-color:#111}
      .empty-state{border:1.5px dashed #e2e2e2;border-radius:14px;padding:30px 20px;text-align:center;color:#888;font-size:14px}
      .font-item{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid #e2e2e2;cursor:pointer}
      .font-item:first-child{border-top:1px solid #e2e2e2}
      .font-item:hover,.font-item.active{background:#f4f4f2}
      .font-num{font-size:10px;color:#ccc;min-width:18px}
      .font-preview{font-size:28px;line-height:1.3}
      .font-action-row{display:none;align-items:center;gap:12px;padding:10px 4px 10px 28px;border-bottom:1px solid #e2e2e2;background:#f4f4f2}
      .font-action-row.open{display:flex}
      .upload-zone{display:block;border:1.5px dashed #e2e2e2;border-radius:14px;padding:30px 20px;text-align:center;cursor:pointer;margin-bottom:14px}
      .upload-zone:hover{border-color:#111}
      .stage-outer{border:1.5px solid #e2e2e2;border-radius:14px;overflow:hidden;background:#f0efed;margin-bottom:16px}
      #stage{display:block;width:100%;height:380px;touch-action:none;cursor:grab}
      #stage:active{cursor:grabbing}
      @media(max-width:500px){#stage{height:290px}}
      .layer-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1.5px solid #e2e2e2;border-radius:10px;cursor:pointer;background:#fff;margin-bottom:6px}
      .layer-item.active{border-color:#111}
      .layer-thumb{width:48px;height:48px;border-radius:6px;object-fit:contain;background:#f0f0ee}
      .slider-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
      .slider-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#888;min-width:70px}
      .slider-row input[type=range]{flex:1;accent-color:#111;cursor:pointer}
      .slider-val{font-size:13px;font-weight:700;min-width:40px;text-align:right}
      .final-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      .spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      #cam_wrap video{width:100%;max-height:300px;border-radius:14px;border:1px solid #e2e2e2;background:#000;display:block}
      .photo-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
      .section-head{display:flex;align-items:center;gap:12px;margin-bottom:22px}
      .section-title-text{font-size:20px;font-weight:400}
    `
    document.head.appendChild(style)
    if (designUrl) (window as any).__preloadDesign = designUrl
    const timer = setTimeout(initSimulator, 300)
    return () => { clearTimeout(timer); (window as any).__preloadDesign = undefined }
  }, [designUrl])

  return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:'Helvetica,Arial,sans-serif'}}>
      <div style={{maxWidth:680,margin:'0 auto',padding:'40px 20px 80px'}}>

        <div style={{textAlign:'center',marginBottom:48}}>
          <h1 style={{fontSize:'clamp(24px,5vw,36px)',fontWeight:400,letterSpacing:'-0.5px',fontFamily:'Georgia,serif'}}>
            Prueba tu tatuaje
          </h1>
          <p style={{marginTop:8,fontSize:13,color:'#888'}}>
            Escribe una frase o sube tu diseño y ve cómo quedaría en tu piel
          </p>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:40}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
            <div id="dot1" style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #111',background:'#111',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>1</div>
            <span style={{fontSize:10,letterSpacing:'.06em',textTransform:'uppercase' as const,color:'#111'}}>Tu diseño</span>
          </div>
          <div id="sline-1" style={{height:1,width:60,background:'#e2e2e2',marginBottom:16}}></div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
            <div id="dot2" style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #e2e2e2',background:'#fff',color:'#888',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>2</div>
            <span id="dot2label" style={{fontSize:10,letterSpacing:'.06em',textTransform:'uppercase' as const,color:'#888'}}>Tu foto</span>
          </div>
        </div>

        <div className="tt-section visible" id="sec-choose">
          <div style={{display:'flex',flexDirection:'column'}}>
            <button className="choice-btn" id="ch-font">
              <span className="choice-num">01</span>
              <span>
                <span className="choice-title">Explorar tipografías</span>
                <span className="choice-sub">Escribe tu texto y prueba distintas fuentes caligráficas</span>
              </span>
              <span className="choice-arrow">&rarr;</span>
            </button>
            <button className="choice-btn" id="ch-upload">
              <span className="choice-num">02</span>
              <span>
                <span className="choice-title">Subir un diseño</span>
                <span className="choice-sub">PNG o JPG — mejor con fondo transparente o blanco</span>
              </span>
              <span className="choice-arrow">&rarr;</span>
            </button>
          </div>
        </div>

        <div className="tt-section" id="sec-font">
          <div className="section-head">
            <button className="back-btn" id="back-font">&larr;</button>
            <span className="section-title-text">Tipografías</span>
          </div>
          <div className="input-row">
            <textarea id="textoUsuario" placeholder="Escribe tu texto…" maxLength={60} rows={1}></textarea>
            <button className="btn-primary" id="btnGenerar">Ver fuentes</button>
          </div>
          <div id="estado-inicial" className="empty-state">
            Escribe tu texto y pulsa <strong>Ver fuentes</strong>
          </div>
          <div id="font-list"></div>
        </div>

        <div className="tt-section" id="sec-upload">
          <div className="section-head">
            <button className="back-btn" id="back-upload">&larr;</button>
            <span className="section-title-text">Subir diseño</span>
          </div>
          <label className="upload-zone" htmlFor="design_in">
            <strong>Toca para elegir archivo</strong>
            <p style={{fontSize:12,color:'#888',marginTop:5}}>PNG con fondo transparente recomendado</p>
          </label>
          <input id="design_in" type="file" accept="image/*" style={{display:'none'}} />
          <img id="design_preview" alt="" style={{display:'none',width:'100%',maxHeight:130,objectFit:'contain' as const,borderRadius:14,border:'1px solid #e2e2e2',marginBottom:14}} />
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <button className="btn-primary" id="design_use">Usar en foto &rarr;</button>
            <span style={{fontSize:12,color:'#888'}} id="designStatus"></span>
          </div>
        </div>

        <div id="divider-photo" style={{display:'none',height:1,background:'#e2e2e2',margin:'40px 0'}}></div>

        <div className="tt-section" id="sec-photo">
          <p style={{fontSize:12,textTransform:'uppercase' as const,letterSpacing:'0.06em',color:'#888',marginBottom:10}}>
            Sube tu foto para ver cómo te quedarán los diseños
          </p>
          <div className="photo-actions">
            <label className="btn-ghost" style={{cursor:'pointer'}}>
              📁 Subir foto
              <input id="photo_in" type="file" accept="image/*" style={{display:'none'}} />
            </label>
            <button className="btn-ghost" id="camera_btn">📷 Cámara</button>
            <button className="btn-ghost" id="switch_camera" style={{display:'none'}}>🔄 Cambiar</button>
            <button className="btn-ghost" id="stop_camera" style={{display:'none'}}>✖ Cerrar</button>
          </div>
          <div id="cam_wrap" style={{display:'none'}}>
            <video id="cam" autoPlay playsInline></video>
            <div style={{marginTop:8}}>
              <button className="btn-primary" id="capture_btn">📸 Capturar</button>
            </div>
          </div>
          <div className="stage-outer">
            <canvas id="stage"></canvas>
          </div>
          <div id="layers-section" style={{display:'none',marginBottom:16}}>
            <p style={{fontSize:12,textTransform:'uppercase' as const,letterSpacing:'.08em',color:'#888',marginBottom:10}}>Diseños añadidos</p>
            <div id="layers-list"></div>
            <button className="btn-ghost" id="add_another" style={{width:'100%',justifyContent:'center',borderStyle:'dashed',marginTop:10}}>
              ＋ Añadir otro diseño
            </button>
          </div>
          <div id="layer-controls" style={{display:'none',marginBottom:16}}>
            <p style={{fontSize:11,textTransform:'uppercase' as const,letterSpacing:'.07em',color:'#888',marginBottom:10}}>
              Ajustando: <span id="active-layer-name" style={{color:'#111',fontStyle:'italic',textTransform:'none' as const}}>&mdash;</span>
            </p>
            <div className="slider-row">
              <span className="slider-label">Tamaño</span>
              <input id="size_slider" type="range" min="10" max="300" defaultValue="110" />
              <span className="slider-val" id="size_value">110%</span>
            </div>
            <div className="slider-row">
              <span className="slider-label">Rotación</span>
              <input id="rot_slider" type="range" min="-180" max="180" defaultValue="0" />
              <span className="slider-val" id="rot_value">0°</span>
            </div>
          </div>
          <div className="final-actions">
            <button className="btn-ghost" id="fit_btn">⊕ Centrar</button>
            <button className="btn-ghost" id="flip_btn">↔ Voltear foto</button>
            <button className="btn-primary" id="download_btn">⬇ Descargar</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ProbadorPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'#aaa'}}>Cargando...</p></div>}>
      <ProbadorContent />
    </Suspense>
  )
}

function initSimulator() {
  const FUENTES = ["Magenta","Roslyna","RetroSignature","JeeWish","Botterill","Halimun","ShoppingScript","MiltonOne","CherryHand","FreshFlower","SimpleRegular","Bookish","Simplicity","SnellRegular"]
  const IS_TOUCH = window.matchMedia("(hover:none)").matches
  const secChoose = document.getElementById("sec-choose")
  const secFont = document.getElementById("sec-font")
  const secUpload = document.getElementById("sec-upload")
  const secPhoto = document.getElementById("sec-photo")
  const dividerPhoto = document.getElementById("divider-photo")
  if (!secChoose) return

  function show(el: HTMLElement | null) { if (!el) return; el.style.removeProperty("display"); requestAnimationFrame(() => el.classList.add("visible")) }
  function hide(el: HTMLElement | null) { if (!el) return; el.classList.remove("visible"); el.style.display = "none" }
  function goChoose() { hide(secFont); hide(secUpload); show(secChoose) }

  document.getElementById("ch-font")!.onclick = () => { hide(secChoose); show(secFont) }
  document.getElementById("ch-upload")!.onclick = () => { hide(secChoose); show(secUpload) }
  document.getElementById("back-font")!.onclick = goChoose
  document.getElementById("back-upload")!.onclick = goChoose
  document.getElementById("add_another")?.addEventListener("click", () => { hide(secFont); hide(secUpload); show(secChoose) })

  function revealPhoto() {
    if (dividerPhoto) dividerPhoto.style.display = "block"
    if (!secPhoto?.classList.contains("visible")) show(secPhoto)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resizeStage(); drawStage()
      setTimeout(() => secPhoto?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
    }))
  }

  let layers: any[] = [], activeLayerId: string | null = null, layerCounter = 0
  const layersSection = document.getElementById("layers-section")
  const layersList = document.getElementById("layers-list")
  const layerControls = document.getElementById("layer-controls")
  const activeLayerNameEl = document.getElementById("active-layer-name")
  const sizeSlider = document.getElementById("size_slider") as HTMLInputElement
  const sizeValue = document.getElementById("size_value")
  const rotSlider = document.getElementById("rot_slider") as HTMLInputElement
  const rotValue = document.getElementById("rot_value")

  function getActive() { return layers.find((l: any) => l.id === activeLayerId) || null }
  function syncSliders(l: any) {
    if (!l) return
    if (sizeSlider) sizeSlider.value = String(Math.round(l.scale * 100))
    if (sizeValue) sizeValue.textContent = Math.round(l.scale * 100) + "%"
    if (rotSlider) rotSlider.value = String(l.rotation)
    if (rotValue) rotValue.textContent = Math.round(l.rotation) + "\u00B0"
    if (activeLayerNameEl) activeLayerNameEl.textContent = l.label
  }
  function setActiveLayer(id: string) {
    activeLayerId = id
    const l = getActive()
    if (l) { syncSliders(l); if (layerControls) layerControls.style.display = "block" }
    renderLayerList(); drawStage()
  }
  function addLayer(imgEl: HTMLImageElement, label: string, thumbURL: string) {
    layerCounter++
    const id = "layer_" + layerCounter
    layers.push({ id, label, img: imgEl, ox: -1, oy: -1, scale: 1.1, rotation: 0, thumbURL })
    if (layersSection) layersSection.style.display = "block"
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const { W, H } = getLogical()
      const l = layers.find((x: any) => x.id === id)
      if (l) { l.ox = W * .5; l.oy = H * .45 }
      setActiveLayer(id); drawStage()
    }))
  }
  function removeLayer(id: string) {
    layers = layers.filter((l: any) => l.id !== id)
    if (activeLayerId === id) activeLayerId = layers.length > 0 ? layers[layers.length - 1].id : null
    if (layers.length === 0) {
      if (layersSection) layersSection.style.display = "none"
      if (layerControls) layerControls.style.display = "none"
    } else if (activeLayerId) setActiveLayer(activeLayerId)
    renderLayerList(); drawStage()
  }
  function renderLayerList() {
    if (!layersList) return
    layersList.innerHTML = ""
    ;[...layers].reverse().forEach((l: any) => {
      const item = document.createElement("div")
      item.className = "layer-item" + (l.id === activeLayerId ? " active" : "")
      const thumb = document.createElement("img"); thumb.className = "layer-thumb"; thumb.src = l.thumbURL
      const info = document.createElement("div"); info.style.flex = "1"
      const name = document.createElement("div"); name.style.cssText = "font-size:13px;color:#111"; name.textContent = l.label
      const meta = document.createElement("div"); meta.style.cssText = "font-size:11px;color:#888;margin-top:2px"
      meta.textContent = Math.round(l.scale * 100) + "% \u00B7 " + Math.round(l.rotation) + "\u00B0"
      info.appendChild(name); info.appendChild(meta)
      const del = document.createElement("button")
      del.style.cssText = "background:none;color:#c00;border:1px solid #fcc;border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer"
      del.textContent = "\u2715"
      del.addEventListener("click", (e) => { e.stopPropagation(); removeLayer(l.id) })
      item.appendChild(thumb); item.appendChild(info); item.appendChild(del)
      item.addEventListener("click", () => setActiveLayer(l.id))
      layersList.appendChild(item)
    })
  }
  sizeSlider?.addEventListener("input", () => { const l = getActive(); if (!l) return; l.scale = parseInt(sizeSlider.value) / 100; if (sizeValue) sizeValue.textContent = sizeSlider.value + "%"; renderLayerList(); drawStage() })
  rotSlider?.addEventListener("input", () => { const l = getActive(); if (!l) return; l.rotation = parseInt(rotSlider.value); if (rotValue) rotValue.textContent = l.rotation + "\u00B0"; renderLayerList(); drawStage() })
  document.getElementById("fit_btn")?.addEventListener("click", () => { const l = getActive(); if (!l) return; const { W, H } = getLogical(); l.ox = W * .5; l.oy = H * .45; drawStage() })

  const stage = document.getElementById("stage") as HTMLCanvasElement
  const stCtx = stage?.getContext("2d")
  let photoImg: HTMLImageElement | null = null, photoFlipped = false

  function getLogical() { const r = stage.getBoundingClientRect(); return { W: r.width, H: r.height } }
  function resizeStage() {
    if (!stage) return
    const r = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
    const nw = Math.floor(r.width * dpr), nh = Math.floor(r.height * dpr)
    if (stage.width === nw && stage.height === nh) return
    stage.width = nw; stage.height = nh
    stCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  function layerDims(l: any) { const baseW = 300, baseH = l.img.naturalHeight * (baseW / l.img.naturalWidth); return { dw: baseW * l.scale, dh: baseH * l.scale } }

  const HANDLE_R = 7
  function getHandles(l: any) {
    const { dw, dh } = layerDims(l)
    const rad = l.rotation * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad)
    function rot(x: number, y: number) { return { x: l.ox + cos * x - sin * y, y: l.oy + sin * x + cos * y } }
    return { tl: rot(-dw/2,-dh/2), tr: rot(dw/2,-dh/2), br: rot(dw/2,dh/2), bl: rot(-dw/2,dh/2), rot: rot(0,-dh/2-28) }
  }
  function hitHandle(px: number, py: number, l: any) {
    const h = getHandles(l)
    const dist = (a: any, b: any) => Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)
    if (dist({x:px,y:py},h.rot) < HANDLE_R+3) return "rot"
    const rad = l.rotation * Math.PI / 180, cos = Math.cos(-rad), sin = Math.sin(-rad)
    const dx = px-l.ox, dy = py-l.oy, lx = cos*dx-sin*dy, ly = sin*dx+cos*dy
    const { dw, dh } = layerDims(l)
    if (Math.abs(lx+dw/2)<HANDLE_R*1.8&&Math.abs(ly+dh/2)<HANDLE_R*1.8) return "tl"
    if (Math.abs(lx-dw/2)<HANDLE_R*1.8&&Math.abs(ly+dh/2)<HANDLE_R*1.8) return "tr"
    if (Math.abs(lx-dw/2)<HANDLE_R*1.8&&Math.abs(ly-dh/2)<HANDLE_R*1.8) return "br"
    if (Math.abs(lx+dw/2)<HANDLE_R*1.8&&Math.abs(ly-dh/2)<HANDLE_R*1.8) return "bl"
    if (Math.abs(lx)<=dw/2&&Math.abs(ly)<=dh/2) return "move"
    return null
  }
  function drawHandles(l: any) {
    if (!stCtx) return
    const h = getHandles(l), rad = l.rotation * Math.PI / 180
    stCtx.save()
    stCtx.strokeStyle="rgba(0,0,0,.55)"; stCtx.lineWidth=1.5; stCtx.setLineDash([5,4])
    stCtx.beginPath(); stCtx.moveTo(h.tl.x,h.tl.y); stCtx.lineTo(h.tr.x,h.tr.y); stCtx.lineTo(h.br.x,h.br.y); stCtx.lineTo(h.bl.x,h.bl.y); stCtx.closePath(); stCtx.stroke()
    stCtx.setLineDash([])
    ;[h.tl,h.tr,h.br,h.bl].forEach((p:any) => {
      stCtx.save(); stCtx.translate(p.x,p.y); stCtx.rotate(rad)
      stCtx.fillStyle="#fff"; stCtx.strokeStyle="#333"; stCtx.lineWidth=1.5
      stCtx.fillRect(-HANDLE_R,-HANDLE_R,HANDLE_R*2,HANDLE_R*2); stCtx.strokeRect(-HANDLE_R,-HANDLE_R,HANDLE_R*2,HANDLE_R*2); stCtx.restore()
    })
    stCtx.fillStyle="#fff"; stCtx.strokeStyle="#333"; stCtx.lineWidth=1.5
    stCtx.beginPath(); stCtx.arc(h.rot.x,h.rot.y,HANDLE_R,0,Math.PI*2); stCtx.fill(); stCtx.stroke()
  }
  function drawStage() {
    if (!stCtx||!stage) return
    const { W, H } = getLogical(); stCtx.clearRect(0,0,W,H)
    if (photoImg) {
      stCtx.save()
      if (photoFlipped) { stCtx.translate(W,0); stCtx.scale(-1,1) }
      const pr=photoImg.naturalWidth/photoImg.naturalHeight, cr=W/H
      let dw,dh,dx,dy
      if (pr>cr) { dh=H;dw=H*pr;dx=(W-dw)/2;dy=0 } else { dw=W;dh=W/pr;dx=0;dy=(H-dh)/2 }
      stCtx.drawImage(photoImg,dx,dy,dw,dh); stCtx.restore()
    } else {
      stCtx.fillStyle="#f0efed"; stCtx.fillRect(0,0,W,H)
      stCtx.fillStyle="#aaa"; stCtx.font="13px Helvetica,Arial,sans-serif"; stCtx.textAlign="center"
      stCtx.fillText("Sube una foto para empezar",W/2,H/2); stCtx.textAlign="left"
    }
    layers.forEach((l:any) => {
      if (l.ox<0) return
      const { dw, dh } = layerDims(l)
      stCtx.save(); stCtx.translate(l.ox,l.oy); stCtx.rotate(l.rotation*Math.PI/180)
      if (photoImg) { stCtx.globalCompositeOperation="multiply"; stCtx.globalAlpha=0.82 }
      else stCtx.globalAlpha=0.9
      stCtx.drawImage(l.img,-dw/2,-dh/2,dw,dh); stCtx.restore()
    })
    if (!IS_TOUCH) { const l=getActive(); if(l&&l.ox>=0) drawHandles(l) }
  }

  function stPos(e: any) { const r=stage.getBoundingClientRect(),s=e.touches?e.touches[0]:e; return {x:s.clientX-r.left,y:s.clientY-r.top} }
  function findLayerAt(px: number, py: number) { for(let i=layers.length-1;i>=0;i--){const l=layers[i];if(l.ox<0)continue;if(hitHandle(px,py,l))return l} return null }

  let mouseMode:string|null=null, mouseLast:any=null, scaleInitDist=0, scaleInitScale=1, rotInitAngle=0, rotInitRot=0
  if (!IS_TOUCH) {
    stage.addEventListener("mousedown",(e:MouseEvent)=>{
      const p=stPos(e); let l=getActive(); let hit=l&&l.ox>=0?hitHandle(p.x,p.y,l):null
      if (!hit){l=findLayerAt(p.x,p.y);if(l){setActiveLayer(l.id);hit=hitHandle(p.x,p.y,l)}}
      if (!hit||!l){mouseMode=null;return}
      if (hit==="move"){mouseMode="move";mouseLast=p;stage.style.cursor="grabbing"}
      else if (hit==="rot"){mouseMode="rotate";rotInitAngle=Math.atan2(p.y-l.oy,p.x-l.ox);rotInitRot=l.rotation}
      else {mouseMode="scale";const dx=p.x-l.ox,dy=p.y-l.oy;scaleInitDist=Math.sqrt(dx*dx+dy*dy);scaleInitScale=l.scale}
      e.preventDefault()
    })
    window.addEventListener("mousemove",(e:MouseEvent)=>{
      if (!mouseMode) return
      const l=getActive(); if(!l)return; const p=stPos(e)
      if (mouseMode==="move"){l.ox+=p.x-mouseLast.x;l.oy+=p.y-mouseLast.y;mouseLast=p}
      else if (mouseMode==="rotate"){const a=Math.atan2(p.y-l.oy,p.x-l.ox);l.rotation=rotInitRot+(a-rotInitAngle)*(180/Math.PI)}
      else {const dx=p.x-l.ox,dy=p.y-l.oy,d=Math.sqrt(dx*dx+dy*dy);if(scaleInitDist>1)l.scale=Math.max(0.05,scaleInitScale*(d/scaleInitDist))}
      syncSliders(l); renderLayerList(); drawStage()
    })
    window.addEventListener("mouseup",()=>{mouseMode=null;stage.style.cursor="default"})
  }

  let tState:any=null
  if (IS_TOUCH) {
    const getTD=(a:Touch,b:Touch)=>Math.sqrt((a.clientX-b.clientX)**2+(a.clientY-b.clientY)**2)
    const getTA=(a:Touch,b:Touch)=>Math.atan2(b.clientY-a.clientY,b.clientX-a.clientX)
    const getTM=(a:Touch,b:Touch,r:DOMRect)=>({x:((a.clientX+b.clientX)/2)-r.left,y:((a.clientY+b.clientY)/2)-r.top})
    stage.addEventListener("touchstart",(e:TouchEvent)=>{
      e.preventDefault(); const rect=stage.getBoundingClientRect()
      if (e.touches.length===1){const p={x:e.touches[0].clientX-rect.left,y:e.touches[0].clientY-rect.top};const hit=findLayerAt(p.x,p.y);if(hit)setActiveLayer(hit.id);tState={mode:"drag",last:p}}
      else if (e.touches.length===2){const t0=e.touches[0],t1=e.touches[1],l=getActive();tState={mode:"gesture",initDist:getTD(t0,t1),initAngle:getTA(t0,t1),initScale:l?l.scale:1,initRotation:l?l.rotation:0,initMid:getTM(t0,t1,rect),initOx:l?l.ox:0,initOy:l?l.oy:0}}
    },{passive:false})
    stage.addEventListener("touchmove",(e:TouchEvent)=>{
      e.preventDefault(); if(!tState)return
      const rect=stage.getBoundingClientRect(); const l=getActive()
      if (tState.mode==="drag"&&e.touches.length===1&&l){const p={x:e.touches[0].clientX-rect.left,y:e.touches[0].clientY-rect.top};l.ox+=p.x-tState.last.x;l.oy+=p.y-tState.last.y;tState.last=p;drawStage()}
      else if (tState.mode==="gesture"&&e.touches.length===2&&l){const t0=e.touches[0],t1=e.touches[1];l.scale=Math.max(0.05,Math.min(3,tState.initScale*(getTD(t0,t1)/tState.initDist)));l.rotation=tState.initRotation+(getTA(t0,t1)-tState.initAngle)*(180/Math.PI);const m=getTM(t0,t1,rect);l.ox=tState.initOx+(m.x-tState.initMid.x);l.oy=tState.initOy+(m.y-tState.initMid.y);syncSliders(l);renderLayerList();drawStage()}
    },{passive:false})
    stage.addEventListener("touchend",(e:TouchEvent)=>{
      e.preventDefault()
      if (e.touches.length===0)tState=null
      else if (e.touches.length===1&&tState?.mode==="gesture"){const rect=stage.getBoundingClientRect();tState={mode:"drag",last:{x:e.touches[0].clientX-rect.left,y:e.touches[0].clientY-rect.top}}}
    },{passive:false})
  }

  document.getElementById("flip_btn")?.addEventListener("click",()=>{photoFlipped=!photoFlipped;drawStage()})
  document.getElementById("download_btn")?.addEventListener("click",()=>{const a=document.createElement("a");a.download="mi-tatuaje-preview.jpg";a.href=stage.toDataURL("image/jpeg",0.93);a.click()})
  document.getElementById("photo_in")?.addEventListener("change",(ev:any)=>{const f=ev.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);const img=new Image();img.onload=()=>{photoImg=img;photoFlipped=false;URL.revokeObjectURL(url);resizeStage();drawStage()};img.src=url})

  const cam=document.getElementById("cam") as HTMLVideoElement
  const camWrap=document.getElementById("cam_wrap")
  const switchBtn=document.getElementById("switch_camera")
  const stopBtn=document.getElementById("stop_camera")
  let stream:MediaStream|null=null, facingMode="environment"
  async function startCamera(facing:string){
    if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
    try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280}},audio:false});cam.srcObject=stream;if(camWrap)camWrap.style.display="block";if(switchBtn)switchBtn.style.display="inline-flex";if(stopBtn)stopBtn.style.display="inline-flex";facingMode=facing}catch(err:any){alert("No se pudo abrir la c\u00E1mara: "+err.message)}
  }
  document.getElementById("camera_btn")?.addEventListener("click",()=>startCamera(facingMode))
  switchBtn?.addEventListener("click",()=>{facingMode=facingMode==="environment"?"user":"environment";startCamera(facingMode)})
  stopBtn?.addEventListener("click",()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}cam.srcObject=null;if(camWrap)camWrap.style.display="none";if(switchBtn)switchBtn.style.display="none";if(stopBtn)stopBtn.style.display="none"})
  document.getElementById("capture_btn")?.addEventListener("click",()=>{if(!stream||cam.videoWidth===0){alert("Espera a que la c\u00E1mara est\u00E9 lista.");return}const tmp=document.createElement("canvas");tmp.width=cam.videoWidth;tmp.height=cam.videoHeight;tmp.getContext("2d")?.drawImage(cam,0,0,tmp.width,tmp.height);const img=new Image();img.onload=()=>{photoImg=img;photoFlipped=false;drawStage()};img.src=tmp.toDataURL("image/jpeg",0.93)})

  const designIn=document.getElementById("design_in") as HTMLInputElement
  const designPreview=document.getElementById("design_preview") as HTMLImageElement
  const designStatus=document.getElementById("designStatus")
  let designURL:string|null=null
  function handleDesignFile(file:File){if(!file||!file.type.startsWith("image/"))return;if(designURL)URL.revokeObjectURL(designURL);designURL=URL.createObjectURL(file);designPreview.src=designURL;designPreview.style.display="block";if(designStatus)designStatus.textContent="\u2713 Listo"}
  designIn?.addEventListener("change",(ev:any)=>handleDesignFile(ev.target.files?.[0]))
  document.getElementById("design_use")?.addEventListener("click",()=>{if(!designURL){alert("Primero sube un dise\u00F1o.");return}const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{addLayer(img,"Dise\u00F1o "+(layerCounter+1),designURL!);hide(secUpload);hide(secChoose);revealPhoto()};img.src=designURL})

  const inputTexto=document.getElementById("textoUsuario") as HTMLTextAreaElement
  const btnGenerar=document.getElementById("btnGenerar")
  const estadoInicial=document.getElementById("estado-inicial")
  const fontListEl=document.getElementById("font-list")
  let textoActual=""
  function mostrarListado(texto:string){
    textoActual=texto
    if(estadoInicial)estadoInicial.style.display="none"
    if(!fontListEl)return
    fontListEl.innerHTML=""
    FUENTES.forEach((f,i)=>{
      const item=document.createElement("div");item.className="font-item"
      const num=document.createElement("span");num.className="font-num";num.textContent=(i+1)+"."
      const preview=document.createElement("span");preview.className="font-preview";preview.style.fontFamily=`"${f}",serif`;preview.textContent=(texto||"").replace(/\n/g," \u00B7 ")
      item.appendChild(num);item.appendChild(preview);fontListEl.appendChild(item)
      const row=document.createElement("div");row.className="font-action-row"
      const ns=document.createElement("span");ns.textContent=f
      const btn=document.createElement("button");btn.className="btn-primary";btn.textContent="A\u00F1adir a la foto \u2192"
      row.appendChild(ns);row.appendChild(btn);fontListEl.appendChild(row)
      item.addEventListener("click",()=>{fontListEl.querySelectorAll(".font-item").forEach((el:any)=>el.classList.remove("active"));fontListEl.querySelectorAll(".font-action-row").forEach((el:any)=>el.classList.remove("open"));item.classList.add("active");row.classList.add("open")})
      btn.addEventListener("click",async(e:Event)=>{
        e.stopPropagation();btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Generando\u2026'
        const t=(inputTexto.value||textoActual||"Tu texto").trim()
        const png=await makeTextPNG(t,f)
        const img=new Image();img.onload=()=>{addLayer(img,t+" ("+f+")",png);hide(secFont);hide(secChoose);revealPhoto();btn.disabled=false;btn.textContent="A\u00F1adir a la foto \u2192"};img.src=png
      })
    })
  }
  btnGenerar?.addEventListener("click",()=>{const t=(inputTexto.value||"").trim();if(!t){inputTexto.focus();return}mostrarListado(inputTexto.value)})

  async function makeTextPNG(texto:string,fontFamily:string){
    const fsPx=160,pad=60,lineGap=0.18
    try{if(document.fonts?.load){await document.fonts.load(`normal ${fsPx}px "${fontFamily}"`);await document.fonts.ready}}catch(e){}
    const lines=String(texto||"").split("\n")
    const c=document.createElement("canvas"),ctx=c.getContext("2d")!
    ctx.font=`normal ${fsPx}px "${fontFamily}",serif`
    let maxW=0;for(const ln of lines){const w=Math.ceil(ctx.measureText(ln).width);if(w>maxW)maxW=w}
    const lineH=Math.ceil(fsPx*(1+lineGap))
    c.width=maxW+pad*2;c.height=(lines.length*lineH)+pad*2
    ctx.clearRect(0,0,c.width,c.height);ctx.font=`normal ${fsPx}px "${fontFamily}",serif`;ctx.fillStyle="#111";ctx.textBaseline="top"
    let y=pad;for(const ln of lines){ctx.fillText(ln,pad,y);y+=lineH}
    return c.toDataURL("image/png")
  }

  if((window as any).__preloadDesign){
    const url=(window as any).__preloadDesign
    const img=new Image();img.crossOrigin="anonymous"
    img.onload=()=>{addLayer(img,"Dise\u00F1o precargado",url);hide(secChoose);revealPhoto()}
    img.src=url
  }

  window.addEventListener("resize",()=>{resizeStage();drawStage()})
  resizeStage();drawStage()
}
