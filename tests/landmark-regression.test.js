import test from 'node:test'
import assert from 'node:assert/strict'
import {tripLandmarks} from '../src/features/travel/data/trip-landmarks.js'
import {layoutLandmarks} from '../src/shared/domain/geography/landmark-layout.js'
test('one landmark per prefecture, Kyoto wins over Uji, photos belong to the selected stop',()=>{
 const points=tripLandmarks({days:[{stops:[{name:'宇治桥',photo:{url:'uji.jpg'}},{name:'清水寺',photo:{url:'temple.jpg'}},{name:'东京塔',photo:{url:'tower.jpg'}},{name:'東京塔',photo:{url:'tower.jpg'}},{name:'明治神宫',photo:{url:'torii.jpg'}}]}]})
 assert.equal(new Set(points.map(p=>p.prefecture)).size,points.length)
 assert.deepEqual(points.map(p=>p.id),['tokyo-tower','kiyomizu'])
 assert.deepEqual(points.map(p=>p.photos.map(p=>p.url)),[['tower.jpg'],['temple.jpg']])
})
test('isolated models stay exactly above their geographical point',()=>{
 const [p]=layoutLandmarks([{anchorX:220,anchorY:280}],500,440)
 assert.equal(p.x,220); assert.equal(p.y,280)
})
