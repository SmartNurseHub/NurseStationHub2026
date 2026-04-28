const _locks = new Map();

async function lock(key, fn) {
  while (_locks.get(key)) {
    await new Promise(r => setTimeout(r, 20));
  }
  _locks.set(key,true);
  try { return await fn(); }
  finally { _locks.delete(key); }
}

module.exports = { lock };