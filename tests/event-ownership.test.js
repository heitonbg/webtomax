import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvent, fetchEvents, joinEvent, leaveEvent, deleteEvent } from '../src/api/events.js';
import { isEventOwner } from '../src/utils/eventOwnership.js';

test('ownership handles numeric/string IDs without treating missing IDs as owners', () => {
  assert.equal(isEventOwner({ organizer: { id: 12 } }, '12'), true);
  assert.equal(isEventOwner({}, undefined), false);
  assert.equal(isEventOwner({ organizer: { id: 'guest' } }, 'other'), false);
});

test('organizer cannot join/leave; only organizer can delete; guests can participate', async () => {
  const event = await createEvent({ title: 'Ownership test', organizer: { id: 'test-owner' } });
  await assert.rejects(joinEvent(event.id, 'test-owner'), /Организатор/);
  await assert.rejects(leaveEvent(event.id, 'test-owner'), /Организатор/);
  assert.equal((await fetchEvents()).find((e) => e.id === event.id).participants, 1);
  await joinEvent(event.id, 'test-visitor');
  assert.equal((await fetchEvents()).find((e) => e.id === event.id).participants, 2);
  await leaveEvent(event.id, 'test-visitor');
  assert.equal((await fetchEvents()).find((e) => e.id === event.id).participants, 1);
  await assert.rejects(deleteEvent(event.id, 'test-visitor'), /только организатор/);
  assert.ok((await fetchEvents()).some((e) => e.id === event.id));
  await deleteEvent(event.id, 'test-owner');
  assert.equal((await fetchEvents()).some((e) => e.id === event.id), false);
  await assert.rejects(deleteEvent(event.id, 'test-owner'), /уже удалено/);
});
