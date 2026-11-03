import * as T from 'three'

// Hand-built miniature architecture, in world units. No remote model downloads.
export function buildLandmark(kind) {
  const root = new T.Group(), materials = new Map()
  const mat = color => { if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({color, roughness:.72})); return materials.get(color) }
  function mesh(geometry,color,x=0,y=0,z=0) { const m=new T.Mesh(geometry,mat(color)); m.position.set(x,y,z); root.add(m); return m }
  const box=(x,y,z,w,h,d,c)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z)
  const ball=(x,y,z,r,c)=>mesh(new T.SphereGeometry(r,12,8),c,x,y,z)
  function beam(a,b,r,c) { const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from); const m=mesh(new T.CylinderGeometry(r,r,delta.length(),7),c); m.position.copy(from.add(to).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()); return m }
  const wood='#855534', light='#d6b17a', roof='#394d50', red='#da593b', cream='#fff0d6'
  mesh(new T.CylinderGeometry(1.25,1.18,.14,48),'#a9b69b',0,.02)
  mesh(new T.CylinderGeometry(1.27,1.27,.035,48),'#e0cc98',0,-.05)
  function tree(x,z,scale=1) { beam([x,.1,z],[x,.65*scale,z],.045,wood); for (let i=0;i<3;i++) ball(x+(i-1)*.14*scale,(.65+i*.11)*scale,z,.28*scale,['#627e50','#87995e','#a7ad72'][i]) }
  function roofAt(x,y,z,w,d,h) {
    // Curved hipped eaves: successive rectangular rings taper to a ridge.
    const rings=[[w/2,d/2,0],[w*.41,d*.41,.05],[w*.24,d*.23,h*.68],[w*.2,.015,h]]
    const verts=[]
    for(let j=0;j<3;j++) for(let i=0;i<4;i++) {
      const corner=(r,k)=>{const [a,b,c]=rings[r];return [x+[-a,a,a,-a][k%4],y+c,z+[-b,-b,b,b][k%4]]}
      verts.push(...corner(j,i),...corner(j+1,i),...corner(j,i+1),...corner(j,i+1),...corner(j+1,i),...corner(j+1,i+1))
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();const m=mesh(g,roof);m.material.side=T.DoubleSide
    for(let i=-8;i<=8;i++) {const a=i*w/20;beam([a+x,y+.025,z+d/2],[a*.5+x,y+h,z],.009,'#73817c')}
    beam([x-w*.22,y+h,z],[x+w*.22,y+h,z],.035,'#97a097')
  }
  if(kind==='tower') {
    const levels=[[.12,.66],[.48,.52],[.85,.37],[1.15,.26],[1.52,.20],[1.85,.14],[2.15,.095],[2.4,.045]]
    for(let n=0;n<levels.length-1;n++) {
      const [y,a]=levels[n],[v,b]=levels[n+1], c=n===3||n===5?cream:red
      for(let i=0;i<4;i++) {const p=k=>[[-1,-1],[1,-1],[1,1],[-1,1]][k%4];const u=p(i),q=p(i+1)
        beam([u[0]*a,y,u[1]*a],[u[0]*b,v,u[1]*b],.024,c)
        beam([u[0]*a,y,u[1]*a],[q[0]*b,v,q[1]*b],.012,c)
        beam([q[0]*a,y,q[1]*a],[u[0]*b,v,u[1]*b],.012,c)
        beam([u[0]*a,y,u[1]*a],[q[0]*a,y,q[1]*a],.018,c)
      }
    }
    for(const [y,w] of [[1.03,.72],[1.98,.31]]) {box(0,y,0,w,.13,w,cream);box(0,y+.035,0,w+.015,.045,w+.015,'#526d77');box(0,y+.11,0,w+.08,.055,w+.08,red);for(let i=-3;i<=3;i++) {box(i*w/8,y+.035,w/2+.013,.012,.05,.012,cream);box(w/2+.013,y+.035,i*w/8,.012,.05,.012,cream)}}
    for(let i=0;i<6;i++) beam([0,2.4+i*.065,0],[0,2.465+i*.065,0],.022,i%2?red:cream)
    box(0,.18,0,.65,.22,.55,cream);tree(-.85,.5,.55);tree(.9,.35,.55)
  } else if(kind==='temple') {
    // Kiyomizu's signature hillside stage, exposed lattice and broad cypress roof.
    box(0,.16,-.45,1.65,.22,.8,'#727f55')
    for(let x=-.85;x<=.86;x+=.28) for(const z of [-.58,-.08,.48]) {beam([x,.1,z],[x,.94,z],.035,wood);beam([x,.28,z],[x+.26,.8,z],.018,wood)}
    for(const y of [.32,.62,.89]) for(const z of [-.58,.48]) beam([-.95,y,z],[.95,y,z],.026,wood)
    box(0,.95,0,2.03,.09,1.4,light)
    for(let x=-.95;x<=.96;x+=.13) box(x,1.005,0,.012,.008,1.4,wood)
    box(0,1.26,-.28,1.6,.51,.7,'#bf9568')
    for(let x=-.75;x<=.76;x+=.19) {box(x,1.28,.09,.045,.53,.05,wood);box(x,1.28,.066,.11,.35,.02,'#424a40')}
    for(let x=-.98;x<=.99;x+=.16) beam([x,1,.65],[x,1.22,.65],.017,wood)
    beam([-.99,1.23,.65],[.99,1.23,.65],.024,light)
    for(const x of [-.98,.98]) {beam([x,1.23,-.65],[x,1.23,.65],.023,light);for(let z=-.6;z<.65;z+=.2) beam([x,1,z],[x,1.23,z],.017,wood)}
    roofAt(0,1.53,-.28,2.12,1.35,.55);tree(-.98,-.6,.7);tree(.98,-.65,.8)
  } else if(kind==='torii') {
    for(const x of [-.66,.66]) {beam([x,.13,0],[x,1.85,0],.085,wood);box(x,.17,0,.25,.18,.25,'#68736a')}
    beam([-.95,1.65,0],[.95,1.65,0],.08,wood);box(0,1.88,0,2.12,.15,.22,roof);box(0,1.74,0,1.95,.1,.16,light);box(0,1.56,0,.19,.35,.12,wood);tree(-.85,.5,.75);tree(.85,.5,.85)
  } else if(kind==='mountain') {
    mesh(new T.ConeGeometry(1.12,1.8,48),'#849eac',0,.98);mesh(new T.ConeGeometry(.37,.6,48),cream,0,1.58);tree(-.8,.55,.5);tree(.75,.5,.5)
  } else if(kind==='onsen') {
    box(0,.55,0,1.65,.9,1.1,light);roofAt(0,1.02,0,2.1,1.55,.55)
    for(let x=-.65;x<.7;x+=.18) box(x,.55,.565,.055,.65,.04,wood)
    box(0,.45,.59,.48,.65,.04,'#344f5c');for(const x of [-.65,.65]) {ball(x,.86,.65,.12,'#ffd69b');beam([x,.96,.65],[x,1.1,.65],.015,wood)}
    for(let i=0;i<3;i++) {const curve=new T.CatmullRomCurve3([new T.Vector3(i*.24-.24,1.55,0),new T.Vector3(i*.24-.31,1.75,0),new T.Vector3(i*.24-.2,1.95,0)]);mesh(new T.TubeGeometry(curve,12,.018,6,false),'#e8e4ce')}
  } else if(kind==='bridge') {
    box(0,.13,0,2.1,.035,1.3,'#70aeb6')
    for(let i=-5;i<=5;i++) {const x=i*.18,y=.5+.18*(1-(i/6)**2);box(x,y,0,.17,.07,.65,light);for(const z of [-.34,.34]) {beam([x,y,z],[x,y+.3,z],.022,wood);if(i<5) beam([x,y+.3,z],[x+.18,.8+.18*(1-((i+1)/6)**2),z],.024,wood)}}
    for(const x of [-.7,.7]) for(const z of [-.25,.25]) beam([x,.15,z],[x,.62,z],.055,wood)
  } else if(kind==='deer') {
    const body=ball(0,.8,0,.48,'#bc8a53');body.scale.set(1.4,.7,.65)
    for(const x of [-.4,.4]) for(const z of [-.2,.2]) beam([x,.2,z],[x,.8,z],.045,wood)
    beam([.4,.8,0],[.55,1.35,0],.14,'#bc8a53');const head=ball(.65,1.4,0,.22,'#cfa46d');head.scale.x=1.4;ball(.9,1.4,0,.07,'#3d352c')
    for(const z of [-.15,.15]) {ball(.67,1.47,z,.028,'#222b29');beam([.5,1.55,z],[.42,1.98,z*1.5],.025,wood);beam([.45,1.8,z*1.3],[.24,1.92,z*2],.018,wood)}
    for(let i=0;i<5;i++) ball(-.35+i*.16,.91,.28,.027,cream);tree(-.85,-.5,.75)
  } else if(kind==='guitar') {
    const body=ball(0,.65,0,.45,'#d5a24e');body.scale.set(.8,1,.28);const upper=ball(0,.98,0,.3,'#d5a24e');upper.scale.z=.4;box(0,1.48,0,.13,.9,.09,wood);box(0,1.98,0,.21,.24,.12,light);ball(0,.82,.13,.13,'#3b3027')
    for(let i=-2;i<=2;i++) beam([i*.02,.48,.17],[i*.02,2.05,.09],.004,cream)
    for(let y=1.18;y<1.9;y+=.09) box(0,y,.06,.14,.009,.01,cream)
  } else { tree(-.5,-.25,1.4);tree(.55,.1,1);box(0,.14,.4,1.1,.02,.6,'#77b5b1');beam([-.4,.2,.4],[.4,.2,.4],.08,light) }
  return root
}
