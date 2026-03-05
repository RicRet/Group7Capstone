import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import {
    createReminder,
    deleteReminder,
    listReminders,
    updateReminder
} from '../../services/reminder.service.js';
import {
    createReminderSchema,
    deleteReminderSchema,
    updateReminderSchema
} from '../../validations/reminder.schema.js';

const r = Router();

r.use(requireSession);

// GET /reminders — list all reminders for the session user
r.get('/', async (req, res, next) => {
  try {
    const reminders = await listReminders(req.session.userId);
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

// POST /reminders — create a new reminder
r.post('/', validate(createReminderSchema), async (req, res, next) => {
  try {
    const reminder = await createReminder(req.session.userId, req.body);
    res.status(201).json({ reminder });
  } catch (err) {
    next(err);
  }
});

// PATCH /reminders/:id — update an existing reminder (ownership enforced in service)
r.patch('/:id', validate(updateReminderSchema), async (req, res, next) => {
  try {
    const reminder = await updateReminder(req.session.userId, req.params.id, req.body);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ reminder });
  } catch (err) {
    next(err);
  }
});

// DELETE /reminders/:id — delete a reminder (ownership enforced in service)
r.delete('/:id', validate(deleteReminderSchema), async (req, res, next) => {
  try {
    const deleted = await deleteReminder(req.session.userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reminder not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default r;
