import test from 'node:test'
import assert from 'node:assert/strict'
import { cityStops, journeyStories } from '../src/constants/journey-stories.js'
test('airport filtering keeps out-of-city sightseeing and does not mutate input', () => {
 const stops = [{name:'成田机场'}, {name:'Kansai Airport'}, {name:'Terminal',kind:'airport'}, {name:'富士山',outsideCity:true}, {name:'上野'}]
 assert.deepEqual(cityStops(stops).map(s=>s.name), ['富士山','上野'])
 assert.equal(stops.length,5)
})
test('confirmed journey has distinct outbound and return flights', () => {
 const story=journeyStories['3e455315-8fba-8162-ba83-f7d9b061b8bd']
 assert.equal(story.outbound.from.code,'HKG')
 assert.equal(story.outbound.to.code,'NRT')
 assert.equal(story.inbound.from.code,'KIX')
 assert.equal(story.inbound.to.code,'HKG')
 assert.notEqual(story.outbound.livery.primary,story.inbound.livery.primary)
})
