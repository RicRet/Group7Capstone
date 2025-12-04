import { Router } from 'express';
import addroute from '../../addrouteps.js';
import auth from './auth.routes.js';
import gis from './gis.routes.js';
import health from './health.routes.js';
import users from './users.routes.js';

const r = Router();

r.use('/auth', auth);
r.use('/users', users);
//r.use('/preferences', preferences);
r.use('/gis', gis);
r.use('/', health);
r.use('/routes', addroute);
r.use('/userroute', addroute);
export default r;
