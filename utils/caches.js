import NodeCache from 'node-cache';

export const requestCache = new NodeCache({ stdTTL: 3600, checkperiod: 3600 });